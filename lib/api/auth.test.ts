import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { exchangeAuthorizationCode, logoutRefreshToken, refreshAccessToken } from "@/lib/api/auth";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/constants";

const API_BASE_URL = "http://localhost:3001";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(
  body: unknown,
  init: { status?: number; setCookie?: string } = {},
): Response {
  const headers = new Headers({ "content-type": "application/json" });

  if (init.setCookie) {
    headers.append("set-cookie", init.setCookie);
  }

  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

describe("exchangeAuthorizationCode", () => {
  it("returns the access token and refresh token from Backend Set-Cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { accessToken: "signed-access-token" },
        {
          setCookie: `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token; Path=/; HttpOnly; SameSite=Lax`,
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(exchangeAuthorizationCode("app-code")).resolves.toEqual({
      accessToken: "signed-access-token",
      refreshToken: "opaque-refresh-token",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/token`,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("still returns an access token when Set-Cookie is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ accessToken: "signed-access-token" })),
    );

    await expect(exchangeAuthorizationCode("app-code")).resolves.toEqual({
      accessToken: "signed-access-token",
    });
  });
});

describe("refreshAccessToken", () => {
  it("forwards prm_refresh_token as a Cookie header to Backend /auth/refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ accessToken: "new-access-token" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshAccessToken("opaque-refresh-token")).resolves.toEqual({
      accessToken: "new-access-token",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/refresh`);
    expect(init.method).toBe("POST");
    expect(headers.get("Cookie")).toBe(
      `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token`,
    );
  });

  it("throws 401 when Backend rejects the refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Unauthorized" }, { status: 401 })),
    );

    await expect(refreshAccessToken("invalid-refresh-token")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    } satisfies Partial<ApiError>);
  });
});

describe("logoutRefreshToken", () => {
  it("forwards prm_refresh_token as a Cookie header to Backend /auth/logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutRefreshToken("opaque-refresh-token")).resolves.toBeUndefined();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/logout`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(headers.get("Cookie")).toBe(
      `${REFRESH_TOKEN_COOKIE}=opaque-refresh-token`,
    );
  });

  it("throws when Backend logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "error" }, { status: 500 })),
    );

    await expect(logoutRefreshToken("opaque-refresh-token")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    } satisfies Partial<ApiError>);
  });
});
