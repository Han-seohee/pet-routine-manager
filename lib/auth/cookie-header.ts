import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

function getSetCookieHeaders(headers: Headers): string[] {
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const header = headers.get("set-cookie");
  return header ? [header] : [];
}

export function readCookieValueFromSetCookieHeaders(
  headers: Headers,
  name: string,
): string | undefined {
  for (const header of getSetCookieHeaders(headers)) {
    const pair = header.split(";", 1)[0];
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = pair.slice(0, separatorIndex).trim();
    if (cookieName !== name) {
      continue;
    }

    const value = pair.slice(separatorIndex + 1).trim();
    if (value.length === 0) {
      return undefined;
    }

    return decodeURIComponent(value);
  }

  return undefined;
}

export function buildRefreshTokenCookieHeader(refreshToken: string): string {
  return `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}`;
}
