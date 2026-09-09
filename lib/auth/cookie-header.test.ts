import { describe, expect, it } from "vitest";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";
import {
  buildRefreshTokenCookieHeader,
  readCookieValueFromSetCookieHeaders,
} from "@/lib/auth/cookie-header";

describe("readCookieValueFromSetCookieHeaders", () => {
  it("reads prm_refresh_token from a Set-Cookie header", () => {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
    );

    expect(
      readCookieValueFromSetCookieHeaders(headers, REFRESH_TOKEN_COOKIE),
    ).toBe("opaque-refresh-token");
  });

  it("decodes a URI-encoded cookie value", () => {
    const headers = new Headers();
    headers.append(
      "set-cookie",
      `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent("token/with=special")}; HttpOnly`,
    );

    expect(
      readCookieValueFromSetCookieHeaders(headers, REFRESH_TOKEN_COOKIE),
    ).toBe("token/with=special");
  });

  it("ignores unrelated cookies", () => {
    const headers = new Headers();
    headers.append("set-cookie", "other=value; Path=/");

    expect(
      readCookieValueFromSetCookieHeaders(headers, REFRESH_TOKEN_COOKIE),
    ).toBeUndefined();
  });
});

describe("buildRefreshTokenCookieHeader", () => {
  it("builds a Cookie header for Backend /auth/refresh", () => {
    expect(buildRefreshTokenCookieHeader("opaque-refresh-token")).toBe(
      `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token`,
    );
  });
});
