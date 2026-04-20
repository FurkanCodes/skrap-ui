import { getAccessTokenForFastApi, UnauthenticatedError } from "@/lib/server-auth";

const DEFAULT_BACKEND_BASE_URL = "http://127.0.0.1:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request): Promise<Response> {
  let token: string;
  try {
    token = await getAccessTokenForFastApi();
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Failed to authorize stream request", { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendBaseUrl()}/api/v1/me/usage/stream`, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: request.signal,
    });
  } catch (error) {
    const aborted =
      request.signal.aborted ||
      (error instanceof Error &&
        (error.name === "AbortError" || error.name === "ResponseAborted"));
    if (aborted) {
      // Client disconnected before upstream stream was established.
      return new Response(null, { status: 204 });
    }

    return new Response("Failed to open usage stream", { status: 502 });
  }

  if (!response.ok || !response.body) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/event-stream");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");

  return new Response(response.body, {
    status: 200,
    headers,
  });
}
