import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api/client";
import { refreshAccessToken } from "@/lib/api/auth";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import {
  applyAccessTokenCookie,
  applyRefreshTokenCookie,
} from "@/lib/auth/session";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function invalidResponse() {
  return NextResponse.json({ error: "Invalid response" }, { status: 502 });
}

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return unauthorized();
  }

  try {
    const { accessToken, refreshToken: nextRefreshToken } =
      await refreshAccessToken(refreshToken);
    const response = NextResponse.json({ ok: true });
    applyAccessTokenCookie(response, accessToken);
    return applyRefreshTokenCookie(response, nextRefreshToken);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return unauthorized();
    }

    return invalidResponse();
  }
}
