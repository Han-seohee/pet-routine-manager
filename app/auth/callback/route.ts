import { NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/api/auth";
import { applyAccessTokenCookie } from "@/lib/auth/session";

function redirectToLogin(origin: string) {
  return NextResponse.redirect(new URL("/login", origin));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return redirectToLogin(url.origin);
  }

  try {
    const { accessToken } = await exchangeAuthorizationCode(code);
    const response = NextResponse.redirect(new URL("/family", url.origin));
    return applyAccessTokenCookie(response, accessToken);
  } catch {
    return redirectToLogin(url.origin);
  }
}
