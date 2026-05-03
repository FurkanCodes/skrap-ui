import "server-only";

import { Environment, Paddle } from "@paddle/paddle-node-sdk";

import type { BillingPlanKey } from "@/features/billing/types";

let paddleClient: Paddle | null = null;

export function isBillingPlanKey(value: unknown): value is BillingPlanKey {
  return value === "plus" || value === "pro";
}

export function getPaddleEnvironment(): Environment {
  return process.env.PADDLE_ENV === "production"
    ? Environment.production
    : Environment.sandbox;
}

export function getPaddleClient(): Paddle {
  if (paddleClient) {
    return paddleClient;
  }

  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PADDLE_API_KEY is required");
  }

  paddleClient = new Paddle(apiKey, {
    environment: getPaddleEnvironment(),
  });
  return paddleClient;
}

export function getPaddlePriceId(planKey: BillingPlanKey): string {
  assertPaddlePriceConfig();
  const envName = planKey === "plus" ? "PADDLE_PLUS_PRICE_ID" : "PADDLE_PRO_PRICE_ID";
  const priceId = process.env[envName]?.trim();
  if (!priceId) {
    throw new Error(`${envName} is required`);
  }
  return priceId;
}

export function assertPaddlePriceConfig(): void {
  const plusPriceId = process.env.PADDLE_PLUS_PRICE_ID?.trim() ?? "";
  const proPriceId = process.env.PADDLE_PRO_PRICE_ID?.trim() ?? "";
  if (plusPriceId && proPriceId && plusPriceId === proPriceId) {
    throw new Error("PADDLE_PLUS_PRICE_ID and PADDLE_PRO_PRICE_ID must be different.");
  }
  if (process.env.NODE_ENV !== "production" && process.env.PADDLE_ENV !== "production") {
    return;
  }
  if (!plusPriceId) {
    throw new Error("PADDLE_PLUS_PRICE_ID is required in production.");
  }
  if (!proPriceId) {
    throw new Error("PADDLE_PRO_PRICE_ID is required in production.");
  }
}
