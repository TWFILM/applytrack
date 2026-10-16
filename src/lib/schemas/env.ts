import { z } from "zod";

// Treat empty strings (e.g. `GOOGLE_CLIENT_ID=` copied from .env.example) as unset.
const optionalString = z.preprocess((v) => (v === "" ? undefined : v), z.string().optional());

// Only what drizzle-kit needs, so migrations can run with just a database URL.
export const databaseEnvSchema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: "DATABASE_URL must be a postgres:// or postgresql:// connection string",
  }),
});

// Everything the app needs at runtime. Kept free of `server-only` so drizzle.config.ts
// and unit tests can import it; app code should read from `@/env` instead.
export const serverEnvSchema = databaseEnvSchema
  .extend({
    BETTER_AUTH_SECRET: z
      .string({ error: "BETTER_AUTH_SECRET is required" })
      .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
    BETTER_AUTH_URL: z.url({ error: "BETTER_AUTH_URL must be a URL like http://localhost:3000" }),
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
  })
  .refine((env) => Boolean(env.GOOGLE_CLIENT_ID) === Boolean(env.GOOGLE_CLIENT_SECRET), {
    message: "Set both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or neither",
    path: ["GOOGLE_CLIENT_ID"],
  });

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseWith<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const parseDatabaseEnv = (source: Record<string, string | undefined>): DatabaseEnv =>
  parseWith(databaseEnvSchema, source);

export const parseServerEnv = (source: Record<string, string | undefined>): ServerEnv =>
  parseWith(serverEnvSchema, withVercelDefaults(source));

// Vercel preview deployments each get their own URL, exposed as VERCEL_URL (no scheme).
// If BETTER_AUTH_URL isn't set, use it so auth works on whichever deployment is running.
function withVercelDefaults(source: Record<string, string | undefined>) {
  if (source.BETTER_AUTH_URL || !source.VERCEL_URL) return source;
  return { ...source, BETTER_AUTH_URL: `https://${source.VERCEL_URL}` };
}
