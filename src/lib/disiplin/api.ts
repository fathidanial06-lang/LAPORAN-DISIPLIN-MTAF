// Typed API client for the "Laporan Disiplin Murid" app.
// All requests use relative paths only. Tokens go into either
// `x-student-token` (parent) or `x-staff-token` (staff).

export type TokenType = "parent" | "staff";

export interface ApiError {
  status: number;
  error: string;
  detail?: string;
}

const TOKEN_HEADER: Record<TokenType, string> = {
  parent: "x-student-token",
  staff: "x-staff-token",
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  tokenType: TokenType = "parent"
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers[TOKEN_HEADER[tokenType]] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err: ApiError = {
      status: 0,
      error: "Ralat rangkaian",
      detail: "Tidak dapat menghubungi pelayan. Sila cuba lagi.",
    };
    throw err;
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      error: data?.error || `Ralat ${res.status}`,
      detail: data?.detail,
    };
    throw err;
  }
  return data as T;
}

export function apiGet<T>(path: string, token?: string, tokenType?: TokenType) {
  return request<T>("GET", path, undefined, token, tokenType ?? "parent");
}
export function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string,
  tokenType?: TokenType
) {
  return request<T>("POST", path, body, token, tokenType ?? "parent");
}
export function apiPut<T>(
  path: string,
  body?: unknown,
  token?: string,
  tokenType?: TokenType
) {
  return request<T>("PUT", path, body, token, tokenType ?? "parent");
}
export function apiPatch<T>(
  path: string,
  body?: unknown,
  token?: string,
  tokenType?: TokenType
) {
  return request<T>("PATCH", path, body, token, tokenType ?? "parent");
}
export function apiDelete<T>(path: string, token?: string, tokenType?: TokenType) {
  return request<T>("DELETE", path, undefined, token, tokenType ?? "parent");
}

// Convenience wrappers for staff endpoints.
export const staffApi = {
  get: <T>(path: string, token: string) =>
    apiGet<T>(path, token, "staff"),
  post: <T>(path: string, body?: unknown, token?: string) =>
    apiPost<T>(path, body, token, "staff"),
  put: <T>(path: string, body?: unknown, token?: string) =>
    apiPut<T>(path, body, token, "staff"),
  patch: <T>(path: string, body?: unknown, token: string) =>
    apiPatch<T>(path, body, token, "staff"),
  delete: <T>(path: string, token: string) =>
    apiDelete<T>(path, token, "staff"),
};

// Convenience wrappers for parent endpoints.
export const parentApi = {
  get: <T>(path: string, token?: string) => apiGet<T>(path, token, "parent"),
  post: <T>(path: string, body?: unknown, token?: string) =>
    apiPost<T>(path, body, token, "parent"),
};
