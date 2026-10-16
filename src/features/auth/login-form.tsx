"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { type Control, Controller, type FieldValues, type Path, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { type SignInInput, signInSchema, type SignUpInput, signUpSchema } from "@/lib/schemas/auth";

const AFTER_SIGN_IN = "/today";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {googleEnabled && (
        <>
          <GoogleButton />
          <FieldSeparator>or</FieldSeparator>
        </>
      )}
      <Tabs defaultValue="sign-in">
        <TabsList className="w-full">
          <TabsTrigger value="sign-in">Sign in</TabsTrigger>
          <TabsTrigger value="sign-up">Create account</TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in" className="pt-4">
          <SignInForm />
        </TabsContent>
        <TabsContent value="sign-up" className="pt-4">
          <SignUpForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoogleButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    // Navigates away to Google on success; only returns here on failure.
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: AFTER_SIGN_IN,
    });
    if (error) {
      setError(error.message ?? "Could not start Google sign-in");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={signInWithGoogle}>
        Continue with Google
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

function SignInForm() {
  const router = useRouter();
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInInput) {
    const { error } = await authClient.signIn.email(values);
    if (error) {
      form.setError("root", { message: error.message ?? "Sign-in failed" });
      return;
    }
    router.push(AFTER_SIGN_IN);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        {form.formState.errors.root && (
          <FieldError>{form.formState.errors.root.message}</FieldError>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function SignUpForm() {
  const router = useRouter();
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpInput) {
    const { error } = await authClient.signUp.email(values);
    if (error) {
      form.setError("root", { message: error.message ?? "Could not create account" });
      return;
    }
    router.push(AFTER_SIGN_IN);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <TextField control={form.control} name="name" label="Name" autoComplete="name" />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
        />
        {form.formState.errors.root && (
          <FieldError>{form.formState.errors.root.message}</FieldError>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
}) {
  // Unique per instance so the sign-in and sign-up tabs don't share element ids.
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            {...field}
            id={id}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
