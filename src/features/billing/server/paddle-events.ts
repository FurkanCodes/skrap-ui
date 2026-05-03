import "server-only";

import type { Subscription } from "@paddle/paddle-node-sdk";

import { buildBackendUrl } from "@/features/scraper/server/backend-client";

export interface NormalizedPaddleEvent {
  event_id: string;
  event_type: string;
  occurred_at: string;
  user_id: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_price_id: string | null;
  plan_key: string | null;
  status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  next_billed_at: string | null;
  cancel_at_period_end: boolean;
}

export function normalizePaddleWebhookEvent(event: {
  eventId: string;
  eventType: string;
  occurredAt: string;
  data: object;
}): NormalizedPaddleEvent {
  const data = asRecord(event.data);
  const customData = asRecord(data.customData);
  const billingPeriod = asRecord(data.currentBillingPeriod ?? data.billingPeriod);
  const scheduledChange = asRecord(data.scheduledChange);

  return {
    event_id: event.eventId,
    event_type: event.eventType,
    occurred_at: event.occurredAt,
    user_id: readString(customData, "userId"),
    provider_customer_id: readString(data, "customerId"),
    provider_subscription_id: readSubscriptionId(event.eventType, data),
    provider_price_id: readFirstPriceId(data),
    plan_key: readString(customData, "planKey"),
    status: readString(data, "status"),
    current_period_start: readString(billingPeriod, "startsAt"),
    current_period_end: readString(billingPeriod, "endsAt"),
    next_billed_at: readString(data, "nextBilledAt"),
    cancel_at_period_end: readString(scheduledChange, "action") === "cancel",
  };
}

export function normalizePaddleSubscriptionSyncEvent(input: {
  transactionId: string;
  subscription: Subscription;
}): NormalizedPaddleEvent {
  const { subscription, transactionId } = input;
  const customData = asRecord(subscription.customData);

  return {
    event_id: `sync_${transactionId}_${subscription.id}_${subscription.updatedAt}`,
    event_type: "subscription.updated",
    occurred_at: subscription.updatedAt,
    user_id: readString(customData, "userId"),
    provider_customer_id: subscription.customerId,
    provider_subscription_id: subscription.id,
    provider_price_id: subscription.items[0]?.price.id ?? null,
    plan_key: readString(customData, "planKey"),
    status: subscription.status,
    current_period_start: subscription.currentBillingPeriod?.startsAt ?? null,
    current_period_end: subscription.currentBillingPeriod?.endsAt ?? null,
    next_billed_at: subscription.nextBilledAt,
    cancel_at_period_end: subscription.scheduledChange?.action === "cancel",
  };
}

export async function forwardPaddleBillingEvent(event: NormalizedPaddleEvent): Promise<unknown> {
  const response = await fetch(buildBackendUrl("/api/v1/billing/paddle/events"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Billing-Backend-Secret": process.env.BILLING_BACKEND_SECRET?.trim() || "",
    },
    body: JSON.stringify(event),
    cache: "no-store",
  });

  const responseText = await response.text();
  const parsed = parseJson(responseText);
  if (!response.ok) {
    const error = new Error("Backend rejected Paddle event.");
    Object.assign(error, { status: response.status, detail: parsed });
    throw error;
  }

  return parsed ?? { ok: true };
}

export function readCustomString(
  customData: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  return readString(asRecord(customData), key);
}

function readSubscriptionId(eventType: string, data: Record<string, unknown>): string | null {
  if (eventType.startsWith("subscription.")) {
    return readString(data, "id");
  }
  if (eventType.startsWith("transaction.")) {
    return readString(data, "subscriptionId");
  }
  return readString(data, "subscriptionId") ?? readString(data, "id");
}

function readFirstPriceId(data: Record<string, unknown>): string | null {
  const items = Array.isArray(data.items) ? data.items : [];
  for (const item of items) {
    const price = asRecord(asRecord(item).price);
    const priceId = readString(price, "id");
    if (priceId) {
      return priceId;
    }
  }
  return null;
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
