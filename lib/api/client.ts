import { buildApiUrl } from "@/lib/api/config";
import { getAccessToken } from "@/lib/auth/session";

export type RequestOptions = Omit<RequestInit, "method" | "body"> & {
  /**
   * When true, attach `Authorization: Bearer <access-token>` from the
   * HttpOnly session cookie. Public endpoints must omit this or pass false.
   */
  auth?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`API request failed: ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

async function buildHeaders(
  headersInit: HeadersInit | undefined,
  auth: boolean | undefined,
): Promise<Headers> {
  const headers = new Headers(headersInit);
  headers.set("Accept", "application/json");

  if (auth) {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized");
    }

    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth, headers, ...fetchOptions } = options;

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    headers: await buildHeaders(headers, auth),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  return parseResponse<T>(response);
}

function jsonRequest<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { headers: headersInit, auth, ...rest } = options;
  const headers = new Headers(headersInit);

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  return request<T>(path, {
    ...rest,
    auth,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return jsonRequest<T>(path, "POST", body, options);
  },

  put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return jsonRequest<T>(path, "PUT", body, options);
  },

  patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return jsonRequest<T>(path, "PATCH", body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
};

export type HealthResponse = {
  status: string;
};
