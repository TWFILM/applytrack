import Link from "next/link";

import { Button } from "@/components/ui/button";

// Placeholder landing page. Real landing page comes in Milestone 7 (Polish).
// Signed-in visitors are redirected to /today by src/proxy.ts.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Applytrack</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        Track every job application in one place, know exactly what to do next, and never forget to
        follow up.
      </p>
      <Button asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </main>
  );
}
