import "server-only";

import { randomUUID } from "crypto";

import { getAccessTokenForFastApi } from "@/lib/server-auth";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

interface BackendErrorPayload {
  detail?: unknown;
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "BackendApiError";
  }
}

interface BackendCallOptions {
  auth?: boolean;
  requestId?: string;
  cache?: RequestCache;
  next?: {
    tags?: string[];
    revalidate?: number | false;
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  if (baseUrl.endsWith("/")) {
    return baseUrl.slice(0, -1);
  }

  return baseUrl;
}

function getBackendBaseUrl(): string {
  return normalizeBaseUrl(
    process.env.BACKEND_BASE_URL ??
      process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
      DEFAULT_BACKEND_BASE_URL
  );
}

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown): string {
  if (typeof payload === "object" && payload !== null) {
    const detail = (payload as BackendErrorPayload).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.map((item) => JSON.stringify(item)).join(" | ");
    }

    if (detail !== undefined) {
      return JSON.stringify(detail);
    }
  }

  return "Request failed.";
}

function getJwtDiagnostics(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      aud?: unknown;
      exp?: unknown;
      iat?: unknown;
      iss?: unknown;
      sub?: unknown;
    };

    return {
      aud: claims.aud,
      exp: claims.exp,
      iat: claims.iat,
      iss: claims.iss,
      sub: typeof claims.sub === "string" ? claims.sub.slice(0, 8) : claims.sub,
    };
  } catch {
    return null;
  }
}

function logBackendAuthFailure(path: string, token: string): void {
  console.warn("[backend-auth] Backend rejected bearer token", {
    path,
    backendBaseUrl: getBackendBaseUrl(),
    jwt: getJwtDiagnostics(token),
  });
}

export async function postBackendJson<TResponse, TRequest>(
  path: string,
  payload: TRequest,
  options: BackendCallOptions = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": options.requestId?.trim() || randomUUID().replace(/-/g, ""),
  };

  if (options.auth) {
    const token = await getAccessTokenForFastApi();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildBackendUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsed = parseJson(responseText);

  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      logBackendAuthFailure(path, headers.Authorization.replace(/^Bearer\s+/i, ""));
    }

    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as BackendErrorPayload | null)?.detail
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BackendApiError("Backend returned an unexpected response.", response.status);
  }

  return parsed as TResponse;
}

export async function patchBackendJson<TResponse, TRequest>(
  path: string,
  payload: TRequest,
  options: BackendCallOptions = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": options.requestId?.trim() || randomUUID().replace(/-/g, ""),
  };

  if (options.auth) {
    const token = await getAccessTokenForFastApi();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildBackendUrl(path), {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsed = parseJson(responseText);

  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      logBackendAuthFailure(path, headers.Authorization.replace(/^Bearer\s+/i, ""));
    }

    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as BackendErrorPayload | null)?.detail
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new BackendApiError("Backend returned an unexpected response.", response.status);
  }

  return parsed as TResponse;
}

export async function getBackendJson<TResponse>(
  path: string,
  options: BackendCallOptions = {}
): Promise<TResponse> {
  const cacheMode = options.cache ?? "no-store";
  const explicitRequestId = options.requestId?.trim() || "";
  const requestId =
    explicitRequestId || (cacheMode === "no-store" ? randomUUID().replace(/-/g, "") : "");
  const headers: Record<string, string> = {};
  if (requestId) {
    headers["X-Request-ID"] = requestId;
  }

  if (options.auth) {
    const token = await getAccessTokenForFastApi();
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit & {
    next?: {
      tags?: string[];
      revalidate?: number | false;
    };
  } = {
    method: "GET",
    headers,
    cache: cacheMode,
  };
  if (options.next) {
    fetchOptions.next = options.next;
  }

  const response = await fetch(buildBackendUrl(path), fetchOptions);

  const responseText = await response.text();
  const parsed = parseJson(responseText);

  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      logBackendAuthFailure(path, headers.Authorization.replace(/^Bearer\s+/i, ""));
    }

    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as BackendErrorPayload | null)?.detail
    );
  }
  if (!parsed || typeof parsed !== "object") {
    throw new BackendApiError("Backend returned an unexpected response.", response.status);
  }
  return parsed as TResponse;
}

export async function deleteBackend(path: string, options: BackendCallOptions = {}): Promise<void> {
  const headers: Record<string, string> = {
    "X-Request-ID": options.requestId?.trim() || randomUUID().replace(/-/g, ""),
  };

  if (options.auth) {
    const token = await getAccessTokenForFastApi();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildBackendUrl(path), {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (response.status === 204) {
    return;
  }

  const responseText = await response.text();
  const parsed = parseJson(responseText);
  if (!response.ok) {
    if (response.status === 401 && options.auth) {
      logBackendAuthFailure(path, headers.Authorization.replace(/^Bearer\s+/i, ""));
    }

    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as BackendErrorPayload | null)?.detail
    );
  }
}
