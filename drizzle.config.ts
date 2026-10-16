import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

import { parseServerEnv } from "./src/lib/schemas/env";

// drizzle-kit runs outside Next.js, so load .env.local the same way Next does.
loadEnvConfig(process.cwd());
const env = parseServerEnv(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
  casing: "snake_case",
  dbCredentials: { url: env.DATABASE_URL },
  strict: true,
  verbose: true,
});
