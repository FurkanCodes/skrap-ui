import { NextResponse } from "next/server";

import {
  BackendApiError,
  postBackendJson,
} from "@/features/scraper/server/backend-client";
import type {
  DiscoverRequest,
  ScrapeJobCreateResponse,
  ScrapesRequest,
} from "@/features/scraper/types";

export const runtime = "nodejs";

interface CreateScrapeJobBody {
  endpointMode?: "scrapes" | "discover";
  payload?: ScrapesRequest | DiscoverRequest;
}

export async function POST(request: Request) {
  let body: CreateScrapeJobBody;
  try {
    body = (await request.json()) as CreateScrapeJobBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  const endpointMode = body.endpointMode === "discover" ? "discover" : "scrapes";
  const backendPath = endpointMode === "discover" ? "/api/v1/discover/jobs" : "/api/v1/scrapes/jobs";

  try {
    const response = await postBackendJson<
      ScrapeJobCreateResponse,
      ScrapesRequest | DiscoverRequest | undefined
    >(backendPath, body.payload);
    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof BackendApiError) {
    return NextResponse.json(
      { detail: error.message, backend_detail: error.detail ?? null },
      { status: error.status }
    );
  }
  return NextResponse.json({ detail: "Could not create scrape job." }, { status: 500 });
}
