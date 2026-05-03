import { NextResponse } from "next/server";

import { getPaddleClient } from "@/features/billing/server/paddle";
import type { BillingCurrentResponse, BillingPortalResponse } from "@/features/billing/types";
import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  try {
    const billing = await getBackendJson<BillingCurrentResponse>("/api/v1/billing/current", {
      auth: true,
    });
    const customerId = billing.subscription?.provider_customer_id;
    const subscriptionId = billing.subscription?.provider_subscription_id;
    if (!customerId || !subscriptionId) {
      return NextResponse.json({ detail: "No Paddle subscription found." }, { status: 404 });
    }

    const session = await getPaddleClient().customerPortalSessions.create(customerId, [
      subscriptionId,
    ]);
    const response: BillingPortalResponse = {
      url: session.urls.general.overview,
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open billing portal.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
