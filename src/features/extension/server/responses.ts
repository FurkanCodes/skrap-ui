import { NextResponse } from "next/server";

import { BackendApiError } from "@/features/scraper/server/backend-client";

export function extensionCorsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "DELETE, GET, OPTIONS, POST",
    "Access-Control-Allow-Origin": "*",
  };
}

export function extensionOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: extensionCorsHeaders(),
  });
}

export function extensionJson(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...extensionCorsHeaders(),
      ...(init?.headers ?? {}),
    },
  });
}

export function extensionErrorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof BackendApiError) {
    if (error.status === 401) {
      return extensionJson(
        { detail: "Session expired. Connect Dealvinci again." },
        { status: 401 }
      );
    }

    return extensionJson(
      { detail: error.message },
      { status: error.status }
    );
  }

  return extensionJson({ detail: fallback }, { status: 500 });
}
