import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/schemas/env";

describe("parseServerEnv", () => {
  it("accepts a postgres:// URL", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgres://applytrack:applytrack@localhost:5433/applytrack",
    });
    expect(env.DATABASE_URL).toBe("postgres://applytrack:applytrack@localhost:5433/applytrack");
  });

  it("accepts a postgresql:// URL with query params (Neon style)", () => {
    const url = "postgresql://user:pass@ep-x-pooler.aws.neon.tech/db?sslmode=require";
    expect(parseServerEnv({ DATABASE_URL: url }).DATABASE_URL).toBe(url);
  });

  it("throws a readable error when DATABASE_URL is missing", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-postgres URL", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://localhost:3306/app" })).toThrow(
      /postgres/,
    );
  });

  it("ignores unrelated variables", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgres://localhost/app",
      PATH: "/usr/bin",
    });
    expect(env).toEqual({ DATABASE_URL: "postgres://localhost/app" });
  });
});
