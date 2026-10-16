import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Optimistic redirect only: checks that a session cookie *exists*, not that it's valid
// (no DB call here). Pages, actions and queries still verify via src/server/auth-guard.ts.

const PROTECTED_PREFIXES = ["/today", "/applications", "/insights", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(getSessionCookie(request));

  if (!hasSession && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Signed-in users skip the landing page. /login is deliberately NOT redirected here:
  // an expired session still has a cookie, and /login -> /today -> /login would loop.
  // The login page checks the real session itself.
  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/today/:path*", "/applications/:path*", "/insights/:path*", "/settings/:path*"],
};
