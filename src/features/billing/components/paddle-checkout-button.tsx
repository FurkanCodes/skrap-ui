"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { Environments, PaddleEventData } from "@paddle/paddle-js";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { BillingCheckoutResponse, BillingPlanKey } from "@/features/billing/types";
import { cn } from "@/lib/utils";

type PaddleInstance = Awaited<ReturnType<typeof import("@paddle/paddle-js").initializePaddle>>;

interface PaddleCheckoutButtonProps {
  planKey: BillingPlanKey;
  children: React.ReactNode;
  className?: string;
  idleIcon?: React.ReactNode;
  onCompleted?: () => void | Promise<unknown>;
  autoStart?: boolean;
  onStart?: () => void;
  labels?: Partial<CheckoutLabels>;
}

type CheckoutState = "idle" | "loading" | "syncing" | "pending";
type CheckoutEventHandler = {
  completed: () => void;
  closed: () => void;
  failed: (message?: string | null) => void;
};

interface CheckoutLabels {
  syncing: string;
  pending: string;
  retry: string;
  startError: string;
  syncPendingError: string;
}

let paddlePromise: Promise<PaddleInstance> | null = null;
const checkoutHandlers = new Map<string, CheckoutEventHandler>();

const DEFAULT_LABELS: CheckoutLabels = {
  syncing: "Payment received, syncing...",
  pending: "Payment received. Your plan is still updating.",
  retry: "Refresh plan",
  startError: "Could not start checkout.",
  syncPendingError: "Payment received, but plan sync is still pending.",
};

export function PaddleCheckoutButton({
  planKey,
  children,
  className,
  idleIcon,
  onCompleted,
  autoStart = false,
  onStart,
  labels: labelsProp,
}: PaddleCheckoutButtonProps) {
  const router = useRouter();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const autoStartedRef = useRef(false);
  const transactionIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(false);
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const isBusy = checkoutState === "loading" || checkoutState === "syncing";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      const transactionId = transactionIdRef.current;
      if (transactionId) {
        checkoutHandlers.delete(transactionId);
      }
    };
  }, []);

  const syncTransaction = useCallback((transactionId: string | null) => {
    if (!transactionId) {
      setCheckoutState("syncing");
      void Promise.resolve(onCompleted?.())
        .then(() => {
          if (!isMountedRef.current) {
            return;
          }
          router.refresh();
          setError(null);
          setCheckoutState("idle");
        })
        .catch((err) => {
          if (!isMountedRef.current) {
            return;
          }
          setError(err instanceof Error ? err.message : labels.syncPendingError);
          setCheckoutState("pending");
          router.refresh();
        });
      return;
    }

    setCheckoutState("syncing");
    void syncCompletedTransaction(transactionId, labels.syncPendingError)
      .then(async () => {
        await onCompleted?.();
        if (!isMountedRef.current) {
          return;
        }
        router.refresh();
        setError(null);
        setCheckoutState("idle");
        checkoutHandlers.delete(transactionId);
      })
      .catch(async (err) => {
        if (!isMountedRef.current) {
          return;
        }
        setError(err instanceof Error ? err.message : labels.syncPendingError);
        setCheckoutState("pending");
        router.refresh();
      });
  }, [labels.syncPendingError, onCompleted, router]);

  const startCheckout = useCallback(() => {
    if (isBusy) {
      return;
    }
    setError(null);
    setCheckoutState("loading");
    transactionIdRef.current = null;
    onStart?.();
    startTransition(async () => {
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ planKey }),
        });
        if (response.status === 401) {
          setCheckoutState("idle");
          router.push(
            `/auth/sign-up?next=${encodeURIComponent(`/settings?billing_plan=${planKey}`)}`
          );
          return;
        }
        const payload = await readJson(response);
        if (!response.ok || !isCheckoutResponse(payload)) {
          throw new Error(readError(payload, labels.startError));
        }

        transactionIdRef.current = payload.transactionId;
        checkoutHandlers.set(payload.transactionId, {
          completed: () => {
            checkoutHandlers.delete(payload.transactionId);
            syncTransaction(payload.transactionId);
          },
          closed: () => {
            checkoutHandlers.delete(payload.transactionId);
            if (transactionIdRef.current === payload.transactionId) {
              transactionIdRef.current = null;
            }
            if (isMountedRef.current) {
              setCheckoutState("idle");
              setError(null);
            }
          },
          failed: (message) => {
            checkoutHandlers.delete(payload.transactionId);
            if (isMountedRef.current) {
              setError(message?.trim() || labels.startError);
              setCheckoutState("idle");
            }
          },
        });
        const paddle = await loadPaddle();
        paddle.Checkout.open({ transactionId: payload.transactionId });
      } catch (err) {
        const transactionId = transactionIdRef.current;
        if (transactionId) {
          checkoutHandlers.delete(transactionId);
        }
        setError(err instanceof Error ? err.message : labels.startError);
        setCheckoutState("idle");
      }
    });
  }, [isBusy, labels.startError, onStart, planKey, router, startTransition, syncTransaction]);

  const retryPlanSync = useCallback(() => {
    if (checkoutState !== "pending") {
      return;
    }
    setError(null);
    syncTransaction(transactionIdRef.current);
  }, [checkoutState, syncTransaction]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) {
      return;
    }
    autoStartedRef.current = true;
    startCheckout();
  }, [autoStart, startCheckout]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={checkoutState === "pending" ? retryPlanSync : startCheckout}
        disabled={isBusy}
        className={cn(className)}
      >
        {isBusy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : checkoutState === "pending" ? (
          <RefreshCw className="size-4" />
        ) : (
          idleIcon
        )}
        <span className="relative z-10">
          {checkoutState === "syncing"
            ? labels.syncing
            : checkoutState === "pending"
              ? labels.retry
              : children}
        </span>
      </Button>
      {checkoutState === "pending" ? (
        <p className="max-w-sm text-xs text-muted-foreground" aria-live="polite">
          {labels.pending}
        </p>
      ) : null}
      {error ? (
        <p className="max-w-sm text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function syncCompletedTransaction(
  transactionId: string,
  fallbackError: string
): Promise<void> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (attempt > 0) {
      await wait(1500);
    }

    const response = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionId }),
    });
    const payload = await readJson(response);
    if (response.ok) {
      return;
    }

    lastError = new Error(readError(payload, fallbackError));
    if (response.status !== 409) {
      break;
    }
  }

  throw lastError ?? new Error(fallbackError);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function loadPaddle() {
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
        handlePaddleCheckoutEvent(event);
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

function handlePaddleCheckoutEvent(event: PaddleEventData): void {
  const transactionId = event.data?.transaction_id;
  const handler = transactionId
    ? checkoutHandlers.get(transactionId)
    : checkoutHandlers.size === 1
      ? Array.from(checkoutHandlers.values())[0]
      : null;
  if (!handler) {
    return;
  }

  if (event.name === "checkout.completed") {
    handler.completed();
    return;
  }
  if (event.name === "checkout.closed") {
    handler.closed();
    return;
  }
  if (
    event.name === "checkout.error" ||
    event.name === "checkout.failed" ||
    event.name === "checkout.payment.error"
  ) {
    handler.failed(readPaddleEventMessage(event));
  }
}

function readPaddleEventMessage(event: PaddleEventData): string | null {
  const detail = "detail" in event ? event.detail : null;
  return typeof detail === "string" && detail.trim() ? detail : null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isCheckoutResponse(value: unknown): value is BillingCheckoutResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { transactionId?: unknown }).transactionId === "string"
  );
}

function readError(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return fallback;
}
