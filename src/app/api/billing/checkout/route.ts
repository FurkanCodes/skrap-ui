import { NextResponse } from "next/server";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getPaddleClient, getPaddlePriceId, isBillingPlanKey } from "@/features/billing/server/paddle";
import type { BillingCurrentResponse, BillingCheckoutResponse } from "@/features/billing/types";
import type { MeResponse } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

type PaddleClient = ReturnType<typeof getPaddleClient>;
type PaddleCustomer = Awaited<ReturnType<PaddleClient["customers"]["get"]>>;

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
    let customerId: string | null = await resolveCustomerId({
      paddle,
      paddleCustomerId: billing.subscription?.provider_customer_id ?? null,
      email: me.user.email,
      name: me.user.display_name,
      userId: me.user.user_id,
    });

    let transaction;
    try {
      transaction = await createCheckoutTransaction({
        paddle,
        priceId,
        customerId,
        userId: me.user.user_id,
        planKey: body.planKey,
      });
    } catch (error) {
      if (!customerId || !isPaddleCustomerReferenceError(error, customerId)) {
        throw error;
      }
      console.warn("[billing-checkout]", {
        outcome: "customer_rejected_by_transaction",
        userId: me.user.user_id,
        customerId,
        message: readPaddleErrorMessage(error),
      });
      customerId = null;
      transaction = await createCheckoutTransaction({
        paddle,
        priceId,
        customerId,
        userId: me.user.user_id,
        planKey: body.planKey,
      });
    }

    const response: BillingCheckoutResponse = {
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url ?? null,
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
  paddle: PaddleClient;
  paddleCustomerId: string | null;
  email: string | null;
  name: string | null;
  userId: string;
}

async function resolveCustomerId({
  paddle,
  paddleCustomerId,
  email,
  name,
  userId,
}: ResolveCustomerIdInput): Promise<string | null> {
  if (paddleCustomerId) {
    try {
      const customer = await paddle.customers.get(paddleCustomerId);
      const activeCustomerId = await ensureActiveCustomerId({
        paddle,
        customer,
        userId,
        source: "stored_customer_id",
      });
      if (activeCustomerId) {
        return activeCustomerId;
      }
      console.warn("[billing-checkout]", {
        outcome: "stored_customer_unusable",
        userId,
        customerId: paddleCustomerId,
      });
    } catch (error) {
      if (!isPaddleNotFoundError(error)) {
        throw error;
      }
      console.warn("[billing-checkout]", {
        outcome: "stale_customer_id",
        userId,
        customerId: paddleCustomerId,
      });
    }
  }

  const trimmedEmail = email?.trim() ?? "";

  if (trimmedEmail) {
    const activeMatches = await paddle.customers
      .list({
        email: [trimmedEmail],
        status: ["active"],
        perPage: 10,
      })
      .next();
    const newestActiveCustomer = getNewestCustomer(activeMatches);
    if (newestActiveCustomer) {
      return newestActiveCustomer.id;
    }

    const archivedMatches = await paddle.customers
      .list({
        email: [trimmedEmail],
        status: ["archived"],
        perPage: 10,
      })
      .next();
    const newestArchivedCustomer = getNewestCustomer(archivedMatches);
    if (newestArchivedCustomer) {
      const reactivatedCustomerId = await ensureActiveCustomerId({
        paddle,
        customer: newestArchivedCustomer,
        userId,
        source: "email_lookup",
      });
      if (reactivatedCustomerId) {
        return reactivatedCustomerId;
      }
    }
  }

  if (!trimmedEmail) {
    return null;
  }

  try {
    const createdCustomer = await paddle.customers.create({
      email: trimmedEmail,
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
      const customer = await paddle.customers.get(conflictCustomerId);
      const activeCustomerId = await ensureActiveCustomerId({
        paddle,
        customer,
        userId,
        source: "customer_create_conflict",
      });
      if (activeCustomerId) {
        return activeCustomerId;
      }
      console.warn("[billing-checkout]", {
        outcome: "conflict_customer_unusable",
        userId,
        customerId: conflictCustomerId,
        message: readPaddleErrorMessage(error),
      });
      return null;
    }
    throw error;
  }
}

async function createCheckoutTransaction({
  paddle,
  priceId,
  customerId,
  userId,
  planKey,
}: {
  paddle: PaddleClient;
  priceId: string;
  customerId: string | null;
  userId: string;
  planKey: string;
}) {
  return paddle.transactions.create({
    items: [{ priceId, quantity: 1 }],
    ...(customerId ? { customerId } : {}),
    customData: {
      userId,
      planKey,
      app: "dealvinci",
    },
  });
}

async function ensureActiveCustomerId({
  paddle,
  customer,
  userId,
  source,
}: {
  paddle: PaddleClient;
  customer: PaddleCustomer;
  userId: string;
  source: string;
}): Promise<string | null> {
  if (customer.status === "active") {
    return customer.id;
  }

  if (customer.status !== "archived") {
    console.warn("[billing-checkout]", {
      outcome: "unusable_customer_status",
      userId,
      customerId: customer.id,
      status: customer.status,
      source,
    });
    return null;
  }

  try {
    const reactivatedCustomer = await paddle.customers.update(customer.id, {
      status: "active",
    });
    console.warn("[billing-checkout]", {
      outcome: "reactivated_archived_customer",
      userId,
      customerId: customer.id,
      source,
    });
    return reactivatedCustomer.id;
  } catch (error) {
    if (!isPaddleNotFoundError(error)) {
      throw error;
    }
    console.warn("[billing-checkout]", {
      outcome: "archived_customer_missing",
      userId,
      customerId: customer.id,
      source,
      message: readPaddleErrorMessage(error),
    });
    return null;
  }
}

function getNewestCustomer(customers: PaddleCustomer[]): PaddleCustomer | null {
  return customers
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
}

function readExistingCustomerIdFromError(error: unknown): string | null {
  const match = /(ctm_[a-zA-Z0-9]+)/.exec(readPaddleErrorMessage(error));
  return match?.[1] ?? null;
}

function isPaddleCustomerReferenceError(error: unknown, customerId: string): boolean {
  const message = readPaddleErrorMessage(error).toLowerCase();
  return message.includes(customerId.toLowerCase()) && message.includes("customer");
}

function isPaddleNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const status = (error as { status?: unknown; statusCode?: unknown }).status ??
    (error as { statusCode?: unknown }).statusCode;
  if (status === 404) {
    return true;
  }
  const code = readPaddleErrorField(error, "code").toLowerCase();
  if (code.includes("not_found") || code.includes("not-found")) {
    return true;
  }
  return readPaddleErrorMessage(error).toLowerCase().includes("not found");
}

function readPaddleErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "";
  }
  const detail = readPaddleErrorField(error, "detail");
  return detail && detail !== error.message ? `${error.message} ${detail}` : error.message;
}

function readPaddleErrorField(error: unknown, key: "code" | "detail"): string {
  if (!error || typeof error !== "object") {
    return "";
  }
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}
