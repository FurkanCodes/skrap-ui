"use client";

import type { Environments, PaddleEventData } from "@paddle/paddle-js";

type PaddleInstance = Awaited<ReturnType<typeof import("@paddle/paddle-js").initializePaddle>>;
type PaddleEventListener = (event: PaddleEventData) => void;

let paddlePromise: Promise<PaddleInstance> | null = null;
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
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();
  if (!token) {
    throw new Error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is required.");
  }

  paddlePromise ??= import("@paddle/paddle-js").then(({ initializePaddle }) => {
    const environment =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
        ? "production"
        : "sandbox";

    return initializePaddle({
      token,
      environment: environment as Environments,
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
