import { NextResponse } from "next/server";

import { buildBackendUrl } from "@/features/scraper/server/backend-client";

interface AffiliateResolveResponse {
  target_url?: unknown;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const response = await fetch(
    buildBackendUrl(`/api/v1/affiliate/resolve/${encodeURIComponent(token)}`),
    {
      method: "GET",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return new Response("Link unavailable", { status: 404 });
  }

  const payload = (await response.json().catch(() => null)) as AffiliateResolveResponse | null;
  const targetUrl = typeof payload?.target_url === "string" ? payload.target_url : "";
  if (!isHttpUrl(targetUrl)) {
    return new Response("Link unavailable", { status: 404 });
  }

  return NextResponse.redirect(targetUrl);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
