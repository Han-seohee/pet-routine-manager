import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/auth/logout/route";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/constants";

const API_BASE_URL = "http://localhost:3001";
const REFRESH_TOKEN = "opaque-refresh-token-secret-value";
const ACCESS_TOKEN = "signed-access-token-value";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createRequest(cookieHeader?: string) {
  return new NextRequest("http://localhost:3000/auth/logout", {
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

function findCookie(headers: string[], name: string) {
  return headers.find((header) => header.startsWith(`${name}=`));
}

function expectCookieDeleted(setCookie: string | undefined, name: string) {
  expect(setCookie).toBeDefined();
  expect(setCookie).toMatch(new RegExp(`${name}=(?:;|$)`));
  expect(setCookie).toMatch(/max-age=0/i);
  expect(setCookie).toMatch(/path=\//i);
}

describe("POST /auth/logout", () => {
  it("forwards the refresh cookie to Backend and expires both auth cookies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest(
        `${ACCESS_TOKEN_COOKIE}=${ACCESS_TOKEN}; ${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`,
      ),
    );
    const body = await response.json();
    const setCookies = getSetCookieHeaders(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain(REFRESH_TOKEN);
    expect(JSON.stringify(body)).not.toContain(ACCESS_TOKEN);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/auth/logout`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(headers.get("Cookie")).toBe(
      `${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`,
    );

    expectCookieDeleted(
      findCookie(setCookies, ACCESS_TOKEN_COOKIE),
      ACCESS_TOKEN_COOKIE,
    );
    expectCookieDeleted(
      findCookie(setCookies, REFRESH_TOKEN_COOKIE),
      REFRESH_TOKEN_COOKIE,
    );
    expect(setCookies.join("\n")).not.toContain(REFRESH_TOKEN);
    expect(setCookies.join("\n")).not.toContain(ACCESS_TOKEN);
  });

  it("skips Backend and still expires both cookies when the refresh cookie is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest(`${ACCESS_TOKEN_COOKIE}=${ACCESS_TOKEN}`),
    );
    const body = await response.json();
    const setCookies = getSetCookieHeaders(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
    expectCookieDeleted(
      findCookie(setCookies, ACCESS_TOKEN_COOKIE),
      ACCESS_TOKEN_COOKIE,
    );
    expectCookieDeleted(
      findCookie(setCookies, REFRESH_TOKEN_COOKIE),
      REFRESH_TOKEN_COOKIE,
    );
  });

  it("expires both cookies when Backend logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "error" }, { status: 500 })),
    );

    const response = await POST(
      createRequest(`${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`),
    );
    const body = await response.json();
    const setCookies = getSetCookieHeaders(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expectCookieDeleted(
      findCookie(setCookies, ACCESS_TOKEN_COOKIE),
      ACCESS_TOKEN_COOKIE,
    );
    expectCookieDeleted(
      findCookie(setCookies, REFRESH_TOKEN_COOKIE),
      REFRESH_TOKEN_COOKIE,
    );
    expect(JSON.stringify(body)).not.toContain(REFRESH_TOKEN);
  });

  it("treats an already revoked refresh token as a successful logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest(`${REFRESH_TOKEN_COOKIE}=${REFRESH_TOKEN}`),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
