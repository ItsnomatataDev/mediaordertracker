import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: "matata",
  });

  const isStaffRoute =
    pathname.startsWith("/jobs") || pathname.startsWith("/staff");

  if (isStaffRoute && !sessionCookie) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/login" && sessionCookie) {
    return NextResponse.redirect(new URL("/jobs", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/jobs/:path*", "/staff/:path*", "/login"],
};
