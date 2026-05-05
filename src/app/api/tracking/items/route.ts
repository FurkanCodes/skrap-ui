import { NextResponse } from "next/server";

import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const items = await listTrackedItemsQuery();
    return NextResponse.json(items, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const detail =
      error instanceof Error ? error.message : "Could not load tracked items.";
    return NextResponse.json({ detail }, { status });
  }
}
