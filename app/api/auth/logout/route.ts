import { NextRequest, NextResponse } from "next/server";
import { logoutRefreshToken } from "@/lib/api/auth";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    try {
      await logoutRefreshToken(refreshToken);
    } catch {
      // Local session still ends if Backend logout is unavailable.
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  return clearAuthCookies(response);
}
