import { describe, expect, it } from "vitest";

import { parseDatabaseEnv, parseServerEnv } from "@/lib/schemas/env";

const LOCAL_DB = "postgres://applytrack:applytrack@localhost:5433/applytrack";
const SECRET = "x".repeat(32);

const validServerEnv = {
  DATABASE_URL: LOCAL_DB,
  BETTER_AUTH_SECRET: SECRET,
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseDatabaseEnv", () => {
  it("accepts a postgres:// URL", () => {
    expect(parseDatabaseEnv({ DATABASE_URL: LOCAL_DB }).DATABASE_URL).toBe(LOCAL_DB);
  });

  it("accepts a postgresql:// URL with query params (Neon style)", () => {
    const url = "postgresql://user:pass@ep-x-pooler.aws.neon.tech/db?sslmode=require";
    expect(parseDatabaseEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("does not require auth variables (migrations only need the DB)", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: LOCAL_DB })).not.toThrow();
  });

  it("throws a readable error when DATABASE_URL is missing", () => {
    expect(() => parseDatabaseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-postgres URL", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: "mysql://localhost:3306/app" })).toThrow(
      /postgres/,
    );
  });
});

describe("parseServerEnv", () => {
  it("accepts a valid env without Google credentials", () => {
    const env = parseServerEnv(validServerEnv);
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it("drops unrelated variables", () => {
    const env = parseServerEnv({ ...validServerEnv, PATH: "/usr/bin" });
    expect(env).not.toHaveProperty("PATH");
  });

  it("requires a secret of at least 32 characters", () => {
    expect(() => parseServerEnv({ ...validServerEnv, BETTER_AUTH_SECRET: "short" })).toThrow(
      /at least 32/,
    );
    expect(() => parseServerEnv({ ...validServerEnv, BETTER_AUTH_SECRET: undefined })).toThrow(
      /BETTER_AUTH_SECRET/,
    );
  });

  it("treats empty Google variables (copied from .env.example) as unset", () => {
    const env = parseServerEnv({
      ...validServerEnv,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    });
    expect(env.GOOGLE_CLIENT_ID).toBeUndefined();
  });

  it("falls back to https://VERCEL_URL when BETTER_AUTH_URL is unset (preview deploys)", () => {
    const env = parseServerEnv({
      ...validServerEnv,
      BETTER_AUTH_URL: undefined,
      VERCEL_URL: "applytrack-git-feat-x-twfilm.vercel.app",
    });
    expect(env.BETTER_AUTH_URL).toBe("https://applytrack-git-feat-x-twfilm.vercel.app");
  });

  it("prefers an explicit BETTER_AUTH_URL over VERCEL_URL", () => {
    const env = parseServerEnv({ ...validServerEnv, VERCEL_URL: "preview.vercel.app" });
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
  });

  it("rejects only one of the two Google variables", () => {
    expect(() => parseServerEnv({ ...validServerEnv, GOOGLE_CLIENT_ID: "id-only" })).toThrow(
      /both GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET/,
    );
  });
});
