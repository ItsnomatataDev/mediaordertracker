import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/jobs" || pathname.startsWith("/jobs/")) {
    const nextPath = pathname.replace(/^\/jobs/, "/packages") || "/packages";
    const url = new URL(nextPath, request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "matata",
  });

  const isStaffRoute =
    pathname.startsWith("/packages") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/pending");

  if (isStaffRoute && !sessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/signup") && sessionCookie) {
    return NextResponse.redirect(new URL("/packages", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/jobs",
    "/jobs/:path*",
    "/packages",
    "/packages/:path*",
    "/staff",
    "/staff/:path*",
    "/account",
    "/account/:path*",
    "/login",
    "/login/:path*",
    "/signup",
    "/pending",
  ],
};
