import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";

function isProtectedPath(pathname: string): boolean {
  return (
    pathname === "/family" ||
    pathname.startsWith("/family/") ||
    pathname === "/pets" ||
    pathname.startsWith("/pets/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(ACCESS_TOKEN_COOKIE);

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/family", request.url));
  }

  if (isProtectedPath(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/family/:path*", "/pets/:path*"],
};
