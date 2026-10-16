import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/env";

import * as schema from "./schema";

// Next.js dev hot-reloads modules; keep one connection pool on globalThis
// so each reload doesn't open a new pool and exhaust Postgres connections.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client = globalForDb.pgClient ?? postgres(env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

// casing: JS keys are camelCase (`userId`), database columns are snake_case (`user_id`).
export const db = drizzle({ client, schema, casing: "snake_case" });
