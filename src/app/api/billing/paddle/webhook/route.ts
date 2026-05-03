import { NextResponse } from "next/server";

import {
  forwardPaddleBillingEvent,
  normalizePaddleWebhookEvent,
} from "@/features/billing/server/paddle-events";
import { getPaddleClient } from "@/features/billing/server/paddle";

export const runtime = "nodejs";

const FORWARDED_EVENTS = new Set([
  "subscription.created",
  "subscription.updated",
  "subscription.canceled",
  "subscription.activated",
  "subscription.trialing",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "transaction.completed",
]);

export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature")?.trim();
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim()
    ?? process.env.PADDLE_NOTIFICATION_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) {
    return NextResponse.json({ detail: "Missing Paddle webhook configuration." }, { status: 400 });
  }

  try {
    const event = await getPaddleClient().webhooks.unmarshal(
      rawBody,
      webhookSecret,
      signature
    );
    if (!FORWARDED_EVENTS.has(event.eventType)) {
      console.info("[billing-webhook]", {
        outcome: "ignored",
        eventId: event.eventId,
        eventType: event.eventType,
      });
      return NextResponse.json({ ok: true, ignored: true });
    }

    const normalized = normalizePaddleWebhookEvent(event);
    if (!normalized.provider_subscription_id) {
      console.info("[billing-webhook]", {
        outcome: "ignored",
        eventId: normalized.event_id,
        eventType: normalized.event_type,
        reason: "missing_subscription_id",
      });
      return NextResponse.json({ ok: true, ignored: true, reason: "missing_subscription_id" });
    }

    const parsed = await forwardPaddleBillingEvent(normalized);
    console.info("[billing-webhook]", {
      outcome: "forwarded",
      eventId: normalized.event_id,
      eventType: normalized.event_type,
      userId: normalized.user_id,
      subscriptionId: normalized.provider_subscription_id,
      planKey: normalized.plan_key,
      status: normalized.status,
    });
    return NextResponse.json(parsed ?? { ok: true });
  } catch (error) {
    const status = typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 400;
    const backendDetail = (error as { detail?: unknown }).detail;
    const message = error instanceof Error ? error.message : "Invalid Paddle webhook.";
    console.error("[billing-webhook]", {
      outcome: "failed",
      status,
      message,
    });
    return NextResponse.json(
      backendDetail === undefined
        ? { detail: message }
        : { detail: message, backend_detail: backendDetail },
      { status }
    );
  }
}
