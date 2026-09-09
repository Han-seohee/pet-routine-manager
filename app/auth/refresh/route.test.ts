import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/auth/refresh/route";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

const API_BASE_URL = "http://localhost:3001";
const REFRESH_TOKEN = "opaque-refresh-token-secret-value";
const NEW_ACCESS_TOKEN = "new-access-token-value";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createRequest(cookieHeader?: string) {
  return new NextRequest("http://localhost:3000/auth/refresh", {
    method: "POST",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

function jsonResponse(
  body: unknown,
  init: { status?: number } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json" },
  });
}

function getSetCookieHeaders(response: Response): string[] {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const header = response.headers.get("set-cookie");
  return header ? [header] : [];
}

describe("POST /auth/refresh", () => {
  it("forwards the refresh cookie to Backend and sets a new HttpOnly access token cookie", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ accessToken: NEW_ACCESS_TOKEN }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest(`${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`),
    );
    const body = await response.json();
    const setCookies = getSetCookieHeaders(response);
    const accessTokenCookie = setCookies.find((header) =>
      header.startsWith(`${ACCESS_TOKEN_COOKIE}=`),
    );

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain(REFRESH_TOKEN);
    expect(JSON.stringify(body)).not.toContain(NEW_ACCESS_TOKEN);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/refresh`);
    expect(headers.get("Cookie")).toBe(
      `${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`,
    );

    expect(accessTokenCookie).toBeDefined();
    expect(accessTokenCookie).toContain(`${ACCESS_TOKEN_COOKIE}=${NEW_ACCESS_TOKEN}`);
    expect(accessTokenCookie?.toLowerCase()).toContain("httponly");
    expect(accessTokenCookie?.toLowerCase()).toContain("samesite=lax");
    expect(accessTokenCookie).toMatch(/path=\//i);
    expect(accessTokenCookie).toMatch(/max-age=86400/i);
    expect(
      setCookies.some((header) => header.startsWith(`${REFRESH_TOKEN_COOKIE}=`)),
    ).toBe(false);
  });

  it("returns 401 when the refresh token cookie is missing and does not call Backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when Backend rejects the refresh token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const response = await POST(
      createRequest(`${REFRESH_TOKEN_COOKIE}=invalid-refresh-token`),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
    expect(JSON.stringify(body)).not.toContain("invalid-refresh-token");
  });

  it("returns 502 when Backend returns an invalid response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ token: "not-an-access-token" })),
    );

    const response = await POST(
      createRequest(`${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`),
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Invalid response" });
    expect(JSON.stringify(body)).not.toContain(REFRESH_TOKEN);
  });
});
