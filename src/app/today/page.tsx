import type { Metadata } from "next";
import { Suspense } from "react";

import { SignOutButton } from "@/features/auth/sign-out-button";
import { requireUser } from "@/server/auth-guard";

export const metadata: Metadata = { title: "Today · Applytrack" };

// Placeholder: the real Today screen (SPEC §5.4) comes in Milestone 4.
export default function TodayPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requireUser();
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
      </div>
      <SignOutButton />
    </div>
  );
}
