type RequestOptions = Omit<RequestInit, "method" | "body">;

function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  return baseUrl.replace(/\/$/, "");
}

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  return parseResponse<T>(response);
}

function jsonRequest<T>(
  path: string,
  method: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  return request<T>(path, {
    ...options,
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
