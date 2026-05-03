import { NextResponse } from "next/server";

import type { BillingCurrentResponse } from "@/features/billing/types";
import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const billing = await getBackendJson<BillingCurrentResponse>("/api/v1/billing/current", {
      auth: true,
      cache: "no-store",
    });
    return NextResponse.json(billing, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
    const detail = error instanceof Error ? error.message : "Could not load billing state.";
    return NextResponse.json({ detail }, { status });
  }
}
