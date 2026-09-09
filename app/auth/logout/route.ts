import { NextRequest, NextResponse } from "next/server";
import { logoutRefreshToken } from "@/lib/api/auth";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies } from "@/lib/auth/session";

function loggedOut() {
  return clearAuthCookies(NextResponse.json({ ok: true }));
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return loggedOut();
  }

  try {
    await logoutRefreshToken(refreshToken);
  } catch {
    // Local session still ends if Backend logout is unavailable.
  }

  return loggedOut();
}
