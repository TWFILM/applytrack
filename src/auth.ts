import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { env } from "@/env";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  signInSchema,
  signUpSchema,
} from "@/lib/schemas/auth";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";

export const isGoogleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

// Better Auth endpoints whose request bodies we validate with our shared Zod schemas,
// so the server enforces the same rules as the login form (CLAUDE.md: validate on the server).
const bodySchemas = {
  "/sign-up/email": signUpSchema,
  "/sign-in/email": signInSchema,
} as const;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
  },

  socialProviders: isGoogleEnabled
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        },
      }
    : {},

  // Settings columns on `users` (SPEC §4.2). `input: false` stops sign-up requests
  // from setting them; they get DB defaults and are changed via the settings page later.
  user: {
    additionalFields: {
      ghostAfterDays: { type: "number", required: false, defaultValue: 21, input: false },
      followUpAfterDays: { type: "number", required: false, defaultValue: 7, input: false },
      emailRemindersEnabled: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      timezone: { type: "string", required: false, defaultValue: "Asia/Bangkok", input: false },
    },
  },

  session: {
    // Sign the session into a short-lived cookie so most requests skip the DB lookup.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  // TODO(polish): Better Auth's built-in rate limiter defaults to in-memory storage,
  // which isn't shared across serverless instances. Switch to `storage: "database"`
  // (or Redis) in the Polish milestone (SPEC §7).

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const bodySchema = bodySchemas[ctx.path as keyof typeof bodySchemas];
      if (!bodySchema) return;

      const result = bodySchema.safeParse(ctx.body);
      if (!result.success) {
        throw new APIError("BAD_REQUEST", {
          message: result.error.issues[0]?.message ?? "Invalid input",
        });
      }
      // Pass the normalized values (trimmed, lowercased email) on to Better Auth.
      return { context: { ...ctx, body: { ...ctx.body, ...result.data } } };
    }),
  },

  // Lets Server Actions that call auth.api.* set cookies. Must be the last plugin.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
