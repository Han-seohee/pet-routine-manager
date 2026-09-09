import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";
import { exchangeAuthorizationCode } from "@/lib/api/auth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

vi.mock("@/lib/api/auth", () => ({
  exchangeAuthorizationCode: vi.fn(),
}));

const mockedExchange = vi.mocked(exchangeAuthorizationCode);

afterEach(() => {
  vi.clearAllMocks();
});

function getSetCookieHeaders(response: Response): string[] {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const header = response.headers.get("set-cookie");
  return header ? [header] : [];
}

describe("GET /auth/callback", () => {
  it("stores access and refresh tokens as HttpOnly cookies", async () => {
    mockedExchange.mockResolvedValue({
      accessToken: "signed-access-token",
      refreshToken: "opaque-refresh-token",
    });

    const response = await GET(
      new Request("http://localhost:3000/auth/callback?code=app-code"),
    );
    const setCookies = getSetCookieHeaders(response);
    const accessTokenCookie = setCookies.find((header) =>
      header.startsWith(`${ACCESS_TOKEN_COOKIE}=`),
    );
    const refreshTokenCookie = setCookies.find((header) =>
      header.startsWith(`${REFRESH_TOKEN_COOKIE}=`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/family",
    );
    expect(accessTokenCookie?.toLowerCase()).toContain("httponly");
    expect(refreshTokenCookie?.toLowerCase()).toContain("httponly");
    expect(refreshTokenCookie).toContain(
      `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token`,
    );
  });
});
