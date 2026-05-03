"use client";

import type { Environments, PaddleEventData } from "@paddle/paddle-js";

type PaddleInstance = Awaited<ReturnType<typeof import("@paddle/paddle-js").initializePaddle>>;
type PaddleEventListener = (event: PaddleEventData) => void;
type PaddleRuntimeConfig = {
  token: string;
  environment: Environments;
};

let paddlePromise: Promise<PaddleInstance> | null = null;
let configPromise: Promise<PaddleRuntimeConfig> | null = null;
const eventListeners = new Map<PaddleEventListener, number>();

export function subscribePaddleEvents(listener: PaddleEventListener): () => void {
  eventListeners.set(listener, (eventListeners.get(listener) ?? 0) + 1);
  return () => {
    const count = eventListeners.get(listener) ?? 0;
    if (count <= 1) {
      eventListeners.delete(listener);
      return;
    }
    eventListeners.set(listener, count - 1);
  };
}

export async function loadPaddle(): Promise<NonNullable<PaddleInstance>> {
  const config = await getPaddleRuntimeConfig();

  paddlePromise ??= import("@paddle/paddle-js").then(({ initializePaddle }) => {
    return initializePaddle({
      token: config.token,
      environment: config.environment,
      checkout: {
        settings: {
          displayMode: "overlay",
        },
      },
      eventCallback(event) {
        for (const listener of eventListeners.keys()) {
          listener(event);
        }
      },
    });
  });

  try {
    const paddle = await paddlePromise;
    if (!paddle) {
      paddlePromise = null;
      throw new Error("Paddle checkout is unavailable.");
    }
    return paddle;
  } catch (error) {
    paddlePromise = null;
    throw error;
  }
}

async function getPaddleRuntimeConfig(): Promise<PaddleRuntimeConfig> {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (token) {
    const environment: Environments =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
        ? "production"
        : "sandbox";
    return { token, environment };
  }

  configPromise ??= fetch("/api/billing/public-config", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRuntimeConfig(payload)) {
        throw new Error(readConfigError(payload));
      }
      return payload;
    })
    .catch((error) => {
      configPromise = null;
      throw error;
    });

  return configPromise;
}

function isRuntimeConfig(value: unknown): value is PaddleRuntimeConfig {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { token?: unknown }).token === "string" &&
      ((value as { environment?: unknown }).environment === "sandbox" ||
        (value as { environment?: unknown }).environment === "production")
  );
}

function readConfigError(value: unknown): string {
  if (value && typeof value === "object") {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return "Paddle client token is not available.";
}
