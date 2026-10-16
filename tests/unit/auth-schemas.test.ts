import { describe, expect, it } from "vitest";

import { PASSWORD_MAX_LENGTH, signInSchema, signUpSchema } from "@/lib/schemas/auth";

const validSignUp = { name: "Techapat", email: "me@example.com", password: "correct-horse" };

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it("trims the name and normalizes the email", () => {
    const result = signUpSchema.parse({
      ...validSignUp,
      name: "  Techapat  ",
      email: "  Me@Example.COM ",
    });
    expect(result.name).toBe("Techapat");
    expect(result.email).toBe("me@example.com");
  });

  it("rejects a blank name", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, name: "   " }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...validSignUp, email: "not-an-email" }).success).toBe(false);
  });

  it.each([
    ["7 characters", "a".repeat(7), false],
    ["8 characters", "a".repeat(8), true],
    [`${PASSWORD_MAX_LENGTH} characters`, "a".repeat(PASSWORD_MAX_LENGTH), true],
    [`${PASSWORD_MAX_LENGTH + 1} characters`, "a".repeat(PASSWORD_MAX_LENGTH + 1), false],
  ])("password of %s -> valid: %s", (_label, password, valid) => {
    expect(signUpSchema.safeParse({ ...validSignUp, password }).success).toBe(valid);
  });
});

describe("signInSchema", () => {
  it("does not apply sign-up password rules (old passwords must still sign in)", () => {
    expect(signInSchema.safeParse({ email: "me@example.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(signInSchema.safeParse({ email: "me@example.com", password: "" }).success).toBe(false);
  });
});
