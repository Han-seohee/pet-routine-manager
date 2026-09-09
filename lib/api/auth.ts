import { ApiError, apiClient } from "@/lib/api/client";
import { buildApiUrl, getApiBaseUrl } from "@/lib/api/config";
import {
  buildRefreshTokenCookieHeader,
  readCookieValueFromSetCookieHeaders,
} from "@/lib/auth/cookie-header";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

export function getGoogleLoginUrl(): string {
  return `${getApiBaseUrl()}/auth/google`;
}

export function getKakaoLoginUrl(): string {
  return `${getApiBaseUrl()}/auth/kakao`;
}

export type CurrentUser = {
  userId: string;
};

export type AccessTokenResponse = {
  accessToken: string;
};

export type TokenExchangeResponse = AccessTokenResponse & {
  refreshToken?: string;
};

export function getCurrentUser(): Promise<CurrentUser> {
  return apiClient.get<CurrentUser>("/auth/me", { auth: true });
}

function isAccessTokenResponse(value: unknown): value is AccessTokenResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof (value as { accessToken: unknown }).accessToken === "string" &&
    (value as { accessToken: string }).accessToken.length > 0
  );
}

async function parseAccessTokenResponse(
  response: Response,
): Promise<AccessTokenResponse> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, "Invalid response");
  }

  if (!isAccessTokenResponse(data)) {
    throw new ApiError(502, "Invalid response");
  }

  return { accessToken: data.accessToken };
}

/**
 * Exchanges a one-time app authorization code for a JWT.
 * Call only from Next.js Route Handlers / Server Components.
 * Tokens must stay on the server (HttpOnly cookies).
 *
 * Uses a dedicated fetch so Backend `Set-Cookie: prm_refresh_token`
 * can be forwarded to the browser. Browser cookies are not sent
 * automatically on this server-to-server request.
 */
export async function exchangeAuthorizationCode(
  code: string,
): Promise<TokenExchangeResponse> {
  const response = await fetch(buildApiUrl("/auth/token"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  const { accessToken } = await parseAccessTokenResponse(response);
  const refreshToken = readCookieValueFromSetCookieHeaders(
    response.headers,
    REFRESH_TOKEN_COOKIE,
  );

  return refreshToken ? { accessToken, refreshToken } : { accessToken };
}

/**
 * Asks Backend to issue a new access token from an HttpOnly refresh cookie.
 * Call only from Next.js Route Handlers. Pass the Cookie header explicitly;
 * server-side fetch does not forward the browser cookie jar.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<AccessTokenResponse> {
  const response = await fetch(buildApiUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: buildRefreshTokenCookieHeader(refreshToken),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return parseAccessTokenResponse(response);
}

/**
 * Revokes the current device refresh token on the Backend.
 * Call only from Next.js Route Handlers. Pass the Cookie header explicitly;
 * server-side fetch does not forward the browser cookie jar.
 */
export async function logoutRefreshToken(refreshToken: string): Promise<void> {
  const response = await fetch(buildApiUrl("/auth/logout"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: buildRefreshTokenCookieHeader(refreshToken),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }
}
