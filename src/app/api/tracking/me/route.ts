import { NextResponse } from "next/server";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import type { MeResponse } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const me = await getBackendJson<MeResponse>("/api/v1/me", {
      auth: true,
      cache: "no-store",
    });
    return NextResponse.json(me);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh viewer.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
