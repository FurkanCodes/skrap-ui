import { NextResponse } from "next/server";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getPaddleClient, getPaddlePriceId, isBillingPlanKey } from "@/features/billing/server/paddle";
import type { BillingCurrentResponse, BillingCheckoutResponse } from "@/features/billing/types";
import type { MeResponse } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  planKey?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  let body: CheckoutRequestBody;
  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  if (!isBillingPlanKey(body.planKey)) {
    return NextResponse.json({ detail: "Choose a valid paid plan." }, { status: 400 });
  }

  try {
    const [me, billing] = await Promise.all([
      getBackendJson<MeResponse>("/api/v1/me", { auth: true }),
      getBackendJson<BillingCurrentResponse>("/api/v1/billing/current", { auth: true }),
    ]);
    const paddle = getPaddleClient();
    const priceId = getPaddlePriceId(body.planKey);
    const customerId = await resolveCustomerId({
      paddleCustomerId: billing.subscription?.provider_customer_id ?? null,
      email: me.user.email,
      name: me.user.display_name,
      userId: me.user.user_id,
    });

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customerId,
      customData: {
        userId: me.user.user_id,
        planKey: body.planKey,
        app: "dealvinci",
      },
    });

    const response: BillingCheckoutResponse = {
      transactionId: transaction.id,
    };
    console.info("[billing-checkout]", {
      outcome: "created",
      userId: me.user.user_id,
      planKey: body.planKey,
      priceId,
      transactionId: transaction.id,
      customerId,
    });
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    console.error("[billing-checkout]", {
      outcome: "failed",
      planKey: body.planKey,
      message,
    });
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

interface ResolveCustomerIdInput {
  paddleCustomerId: string | null;
  email: string | null;
  name: string | null;
  userId: string;
}

async function resolveCustomerId({
  paddleCustomerId,
  email,
  name,
  userId,
}: ResolveCustomerIdInput): Promise<string> {
  if (paddleCustomerId) {
    return paddleCustomerId;
  }

  const paddle = getPaddleClient();
  const trimmedEmail = email?.trim() ?? "";

  if (trimmedEmail) {
    const customerMatches = await paddle.customers
      .list({
        email: [trimmedEmail],
        status: ["active", "archived"],
        perPage: 10,
      })
      .next();
    const newestCustomer = customerMatches
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (newestCustomer) {
      return newestCustomer.id;
    }
  }

  try {
    const createdCustomer = await paddle.customers.create({
      email: trimmedEmail || `user-${userId}@dealvinci.local`,
      name,
      customData: {
        userId,
        app: "dealvinci",
      },
    });
    return createdCustomer.id;
  } catch (error) {
    const conflictCustomerId = readExistingCustomerIdFromError(error);
    if (conflictCustomerId) {
      return conflictCustomerId;
    }
    throw error;
  }
}

function readExistingCustomerIdFromError(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }
  const match = /customer of id (ctm_[a-zA-Z0-9]+)/.exec(error.message);
  return match?.[1] ?? null;
}
