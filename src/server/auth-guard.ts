import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";

// The real authentication check (proxy.ts only does a fast cookie-presence redirect).
// Every query in src/server/queries and every action in src/server/actions starts here.
// Reads request headers, so callers must render inside a <Suspense> boundary.

/** Current session, or null. Deduplicated per request with React `cache`. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Current user, or redirect to /login. Returns only what UI needs. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id, name, email, image } = session.user;
  return { id, name, email, image };
}

/** Current user's id, or redirect to /login. Use to scope every database query. */
export async function requireUserId(): Promise<string> {
  return (await requireUser()).id;
}
