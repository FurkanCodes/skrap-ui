import { NextResponse } from "next/server";

import { listSupportedSitesQuery } from "@/features/settings/server/queries";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const sites = await listSupportedSitesQuery();
    return NextResponse.json(
      { sites },
      {
        headers: {
          "Cache-Control": "private, max-age=3600",
        },
      }
    );
  } catch (error) {
    const statusCode =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const detail =
      error instanceof Error ? error.message : "Could not load supported sites.";
    return NextResponse.json({ detail }, { status: statusCode });
  }
}
