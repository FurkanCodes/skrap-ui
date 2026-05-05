import { NextResponse } from "next/server";

import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const status = await getTelegramStatusQuery();
    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const statusCode =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const detail =
      error instanceof Error ? error.message : "Could not load Telegram status.";
    return NextResponse.json({ detail }, { status: statusCode });
  }
}
