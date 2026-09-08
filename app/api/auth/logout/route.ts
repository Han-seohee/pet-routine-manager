import { NextResponse } from "next/server";
import { clearAccessTokenCookie } from "@/lib/auth/session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  return clearAccessTokenCookie(response);
}
