import { apiClient } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";

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

export function getCurrentUser(): Promise<CurrentUser> {
  return apiClient.get<CurrentUser>("/auth/me", { auth: true });
}

/**
 * Exchanges a one-time app authorization code for a JWT.
 * Call only from Next.js Route Handlers / Server Components.
 * The returned accessToken must stay on the server (HttpOnly cookie).
 */
export function exchangeAuthorizationCode(
  code: string,
): Promise<AccessTokenResponse> {
  return apiClient.post<AccessTokenResponse>("/auth/token", { code });
}
