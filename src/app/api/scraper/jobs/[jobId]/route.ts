import { NextResponse } from "next/server";

import {
  BackendApiError,
  getBackendJson,
} from "@/features/scraper/server/backend-client";
import type { ScrapeJobStatusResponse } from "@/features/scraper/types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  try {
    const response = await getBackendJson<ScrapeJobStatusResponse>(
      `/api/v1/scrape-jobs/${encodeURIComponent(jobId)}`
    );
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof BackendApiError) {
      return NextResponse.json(
        { detail: error.message, backend_detail: error.detail ?? null },
        { status: error.status }
      );
    }
    return NextResponse.json({ detail: "Could not load scrape job." }, { status: 500 });
  }
}
