import "server-only";

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

function buildBackendUrl(path: string): string {
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

export async function postBackendJson<TResponse, TRequest>(
  path: string,
  payload: TRequest
): Promise<TResponse> {
  const response = await fetch(buildBackendUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsed = parseJson(responseText);

  if (!response.ok) {
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
