import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { isGoogleEnabled } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/login-form";
import { getSession } from "@/server/auth-guard";

export const metadata: Metadata = { title: "Sign in · Applytrack" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      {/* Reads the session, so it streams in behind a boundary (cacheComponents). */}
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Applytrack</CardTitle>
          <CardDescription>Sign in to track your job applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm googleEnabled={isGoogleEnabled} />
        </CardContent>
      </Card>
    </main>
  );
}

// Checks the real session (not just the cookie), so an expired cookie can't cause a loop.
async function RedirectIfSignedIn() {
  if (await getSession()) redirect("/today");
  return null;
}
