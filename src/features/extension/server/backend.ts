import "server-only";

import { randomUUID } from "crypto";

import { BackendApiError } from "@/features/scraper/server/backend-client";

const DEFAULT_BACKEND_BASE_URL = "https://api.dealvinci.com";

function getBackendBaseUrl(): string {
  const baseUrl =
    process.env.BACKEND_BASE_URL ??
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ??
    DEFAULT_BACKEND_BASE_URL;
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function buildBackendUrl(path: string): string {
  return `${getBackendBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const detail = (payload as { detail?: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (detail !== undefined) {
      return JSON.stringify(detail);
    }
  }
  return "Request failed.";
}

export async function postExtensionBackendJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
  options: { authorization?: string | null } = {}
): Promise<TResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Request-ID": randomUUID().replace(/-/g, ""),
  };
  if (options.authorization) {
    headers.Authorization = options.authorization;
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
    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as { detail?: unknown } | null)?.detail
    );
  }

  return parsed as TResponse;
}

export async function deleteExtensionBackend(
  path: string,
  options: { authorization?: string | null } = {}
): Promise<void> {
  const headers: Record<string, string> = {
    "X-Request-ID": randomUUID().replace(/-/g, ""),
  };
  if (options.authorization) {
    headers.Authorization = options.authorization;
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
    throw new BackendApiError(
      getErrorMessage(parsed),
      response.status,
      (parsed as { detail?: unknown } | null)?.detail
    );
  }
}
