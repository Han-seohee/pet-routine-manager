import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/auth/constants";

function getTokenCookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function getTokenCookieOptions(maxAge: number) {
  return {
    ...getTokenCookieBaseOptions(),
    maxAge,
  };
}

function getExpiredTokenCookieOptions() {
  return {
    ...getTokenCookieBaseOptions(),
    maxAge: 0,
  };
}

export function getAccessTokenCookieOptions() {
  return getTokenCookieOptions(ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function getRefreshTokenCookieOptions() {
  return getTokenCookieOptions(REFRESH_TOKEN_MAX_AGE_SECONDS);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function setAccessToken(accessToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getAccessTokenCookieOptions(),
  );
}

export function applyAccessTokenCookie(
  response: NextResponse,
  accessToken: string,
): NextResponse {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    accessToken,
    getAccessTokenCookieOptions(),
  );
  return response;
}

export function applyRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string,
): NextResponse {
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshToken,
    getRefreshTokenCookieOptions(),
  );
  return response;
}

export async function clearAccessToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
}

export function clearAccessTokenCookie(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", getExpiredTokenCookieOptions());
  return response;
}

export function clearRefreshTokenCookie(response: NextResponse): NextResponse {
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", getExpiredTokenCookieOptions());
  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  clearAccessTokenCookie(response);
  clearRefreshTokenCookie(response);
  return response;
}

export async function hasAccessToken(): Promise<boolean> {
  const token = await getAccessToken();
  return Boolean(token);
}
