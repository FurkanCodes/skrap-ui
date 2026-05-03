import { NextResponse } from "next/server";

import {
  forwardPaddleBillingEvent,
  normalizePaddleSubscriptionSyncEvent,
  readCustomString,
} from "@/features/billing/server/paddle-events";
import { getPaddleClient } from "@/features/billing/server/paddle";
import type { BillingSyncResponse } from "@/features/billing/types";
import { invalidateCachedMe } from "@/features/tracking/server/me-cache";
import type { MeResponse } from "@/features/tracking/types";
import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getAuthContext } from "@/lib/auth-dal";

export const runtime = "nodejs";

interface SyncRequestBody {
  transactionId?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  let body: SyncRequestBody;
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  if (typeof body.transactionId !== "string" || !body.transactionId.startsWith("txn_")) {
    return NextResponse.json({ detail: "A valid Paddle transaction ID is required." }, { status: 400 });
  }

  try {
    const [me, transaction] = await Promise.all([
      getBackendJson<MeResponse>("/api/v1/me", { auth: true }),
      getPaddleClient().transactions.get(body.transactionId),
    ]);

    if (transaction.status !== "completed") {
      logBillingSync("info", "pending_transaction", {
        userId: me.user.user_id,
        transactionId: body.transactionId,
        transactionStatus: transaction.status,
      });
      const response: BillingSyncResponse = {
        ok: false,
        outcome: "pending",
        detail: "Payment has not completed yet.",
        status: transaction.status,
        checkoutUrl: transaction.checkout?.url ?? null,
      };
      return NextResponse.json(
        response,
        { status: 409 }
      );
    }
    if (!transaction.subscriptionId) {
      logBillingSync("info", "pending_subscription", {
        userId: me.user.user_id,
        transactionId: body.transactionId,
      });
      const response: BillingSyncResponse = {
        ok: false,
        outcome: "transaction_incomplete",
        detail: "Paddle has not attached a subscription to this transaction yet.",
        checkoutUrl: transaction.checkout?.url ?? null,
      };
      return NextResponse.json(
        response,
        { status: 409 }
      );
    }

    const subscription = await getPaddleClient().subscriptions.get(transaction.subscriptionId);
    const transactionUserId = readCustomString(transaction.customData, "userId");
    const transactionPlanKey = readCustomString(transaction.customData, "planKey");
    const subscriptionUserId = readCustomString(subscription.customData, "userId");
    const ownerUserId = subscriptionUserId ?? transactionUserId;
    if (ownerUserId !== me.user.user_id) {
      logBillingSync("warn", "owner_mismatch", {
        userId: me.user.user_id,
        ownerUserId,
        transactionId: transaction.id,
        subscriptionId: subscription.id,
      });
      const response: BillingSyncResponse = {
        ok: false,
        outcome: "owner_mismatch",
        detail: "Transaction does not belong to this account.",
      };
      return NextResponse.json(
        response,
        { status: 403 }
      );
    }

    const normalizedEvent = normalizePaddleSubscriptionSyncEvent({
      transactionId: transaction.id,
      subscription,
    });
    const normalized = {
      ...normalizedEvent,
      user_id: normalizedEvent.user_id ?? ownerUserId,
      plan_key: normalizedEvent.plan_key ?? transactionPlanKey,
    };
    const result = await forwardPaddleBillingEvent(normalized);
    const backendReason = readBackendReason(result);
    if (readBackendOk(result) === false) {
      logBillingSync("warn", "backend_rejected", {
        userId: me.user.user_id,
        transactionId: transaction.id,
        subscriptionId: subscription.id,
        reason: backendReason,
      });
      const response: BillingSyncResponse = {
        ok: false,
        outcome: "backend_rejected",
        detail: "Backend rejected Paddle event.",
        reason: backendReason,
      };
      return NextResponse.json(
        response,
        { status: 422 }
      );
    }

    invalidateCachedMe(auth.meCacheKey);
    logBillingSync("info", "synced", {
      userId: me.user.user_id,
      transactionId: transaction.id,
      subscriptionId: subscription.id,
      planKey: normalized.plan_key,
      status: normalized.status,
      reason: backendReason,
    });
    const response: BillingSyncResponse = { ok: true, outcome: "synced", reason: backendReason };
    return NextResponse.json(response);
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
    const backendDetail = (error as { detail?: unknown }).detail;
    const message = error instanceof Error ? error.message : "Could not sync billing.";
    logBillingSync("error", "failed", {
      transactionId: body.transactionId,
      status,
      message,
    });
    const response: BillingSyncResponse = {
      ok: false,
      outcome: "failed",
      detail: backendDetail === undefined ? message : `${message}`,
    };
    return NextResponse.json(response, { status });
  }
}

function readBackendReason(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const reason = (value as { reason?: unknown }).reason;
  return typeof reason === "string" ? reason : null;
}

function readBackendOk(value: unknown): boolean | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const ok = (value as { ok?: unknown }).ok;
  return typeof ok === "boolean" ? ok : null;
}

function logBillingSync(
  level: "info" | "warn" | "error",
  outcome: string,
  fields: Record<string, unknown>
): void {
  console[level]("[billing-sync]", { outcome, ...fields });
}
