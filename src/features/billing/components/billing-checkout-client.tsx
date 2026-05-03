"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaddleEventData } from "@paddle/paddle-js";
import type { CheckoutEventsData } from "@paddle/paddle-js/types/checkout/events";
import { AlertCircle, CheckCircle2, Minus, Plus, RefreshCw, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { loadPaddle, subscribePaddleEvents } from "@/features/billing/client/paddle-js";
import type {
  BillingCheckoutResponse,
  BillingPlanKey,
  BillingSyncResponse,
} from "@/features/billing/types";
import { localizePathname } from "@/i18n/paths";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface BillingCheckoutClientProps {
  locale: AppLocale;
  plan: BillingPlanKey | null;
  paymentLinkTransactionId: string | null;
}

type CheckoutState = "preparing" | "ready" | "completed" | "paused" | "error";

export function BillingCheckoutClient({
  locale,
  plan,
  paymentLinkTransactionId,
}: BillingCheckoutClientProps) {
  const t = useTranslations("billingCheckout");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [checkoutState, setCheckoutState] = useState<CheckoutState>("preparing");
  const [transactionId, setTransactionId] = useState<string | null>(paymentLinkTransactionId);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutEventsData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startedRef = useRef(false);
  const transactionIdRef = useRef<string | null>(paymentLinkTransactionId);

  const returnPath = localizePathname("/billing/return", locale);
  const settingsPath = localizePathname("/settings", locale);

  const hasCheckoutData = Boolean(checkoutData);
  const isLoadingCheckout =
    !hasCheckoutData && checkoutState !== "error" && checkoutState !== "paused";

  const buildReturnUrl = useCallback(
    (targetTransactionId: string) => {
      const params = new URLSearchParams();
      params.set("transaction_id", targetTransactionId);
      if (plan) params.set("plan", plan);
      return `${window.location.origin}${returnPath}?${params.toString()}`;
    },
    [plan, returnPath]
  );

  const goToReturn = useCallback(
    (targetTransactionId: string) => {
      const params = new URLSearchParams();
      params.set("transaction_id", targetTransactionId);
      if (plan) params.set("plan", plan);
      router.replace(`${returnPath}?${params.toString()}`, { scroll: false });
    },
    [plan, returnPath, router]
  );

  const openInlineCheckout = useCallback(
    async (targetTransactionId: string, hostedCheckoutUrl?: string | null) => {
      setErrorMessage(null);
      setCheckoutState("preparing");

      try {
        const paddle = await loadPaddle();

        paddle.Checkout.open({
          transactionId: targetTransactionId,
          settings: {
            variant: "one-page",
            displayMode: "inline",
            theme: "dark",
            allowLogout: false,
            frameTarget: "paddle-checkout-frame",
            frameInitialHeight: 640,
            frameStyle:
              "width: 100%; min-height: 640px; background-color: transparent; border: none;",
            successUrl: buildReturnUrl(targetTransactionId),
          },
        });

        setCheckoutState("ready");
      } catch (error) {
        if (hostedCheckoutUrl) {
          window.location.assign(hostedCheckoutUrl);
          return;
        }

        setCheckoutState("error");
        setErrorMessage(error instanceof Error ? error.message : t("errors.openCheckout"));
      }
    },
    [buildReturnUrl, t]
  );

  const recoverHostedCheckoutUrl = useCallback(async (targetTransactionId: string) => {
    const response = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionId: targetTransactionId }),
    });

    const payload = await readJson(response);

    if (isSyncResponse(payload) && payload.checkoutUrl) {
      setCheckoutUrl(payload.checkoutUrl);
      return payload.checkoutUrl;
    }

    return null;
  }, []);

  const startCheckout = useCallback(async () => {
    if (startedRef.current) return;

    startedRef.current = true;
    setErrorMessage(null);
    setCheckoutState("preparing");
    setCheckoutData(null);

    try {
      if (paymentLinkTransactionId) {
        transactionIdRef.current = paymentLinkTransactionId;
        setTransactionId(paymentLinkTransactionId);
        await openInlineCheckout(paymentLinkTransactionId, checkoutUrl);
        return;
      }

      if (!plan) throw new Error(t("errors.planRequired"));

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planKey: plan }),
      });

      const payload = await readJson(response);

      if (!response.ok || !isCheckoutResponse(payload)) {
        throw new Error(readError(payload, t("errors.startCheckout")));
      }

      transactionIdRef.current = payload.transactionId;
      setTransactionId(payload.transactionId);
      setCheckoutUrl(payload.checkoutUrl);

      await openInlineCheckout(payload.transactionId, payload.checkoutUrl);
    } catch (error) {
      startedRef.current = false;
      setCheckoutState("error");
      setErrorMessage(error instanceof Error ? error.message : t("errors.startCheckout"));
    }
  }, [checkoutUrl, openInlineCheckout, paymentLinkTransactionId, plan, t]);

  const reopenCheckout = useCallback(async () => {
    setCheckoutData(null);

    if (!transactionId) {
      startedRef.current = false;
      await startCheckout();
      return;
    }

    let hostedUrl = checkoutUrl;

    if (!hostedUrl && paymentLinkTransactionId) {
      hostedUrl = await recoverHostedCheckoutUrl(transactionId);
    }

    await openInlineCheckout(transactionId, hostedUrl);
  }, [
    checkoutUrl,
    openInlineCheckout,
    paymentLinkTransactionId,
    recoverHostedCheckoutUrl,
    startCheckout,
    transactionId,
  ]);

  useEffect(() => {
    const unsubscribe = subscribePaddleEvents((event: PaddleEventData) => {
      const eventTransactionId = event.data?.transaction_id;

      if (
        eventTransactionId &&
        transactionIdRef.current &&
        eventTransactionId !== transactionIdRef.current
      ) {
        return;
      }

      if (event.data) setCheckoutData(event.data);

      if (event.name === "checkout.completed") {
        const completedTransactionId = event.data?.transaction_id ?? transactionIdRef.current;
        if (completedTransactionId) {
          setCheckoutState("completed");
          goToReturn(completedTransactionId);
        }
        return;
      }

      if (event.name === "checkout.closed") {
        setCheckoutState("paused");
        return;
      }

      if (isPaddleErrorEvent(event)) {
        setErrorMessage(readPaddleEventMessage(event) ?? t("errors.openCheckout"));
        setCheckoutState("error");
      }
    });

    return unsubscribe;
  }, [goToReturn, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void startCheckout();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [startCheckout]);

  return (
    <div className="min-h-screen bg-[#0e0f0e] text-[#e8e8e6] font-sans">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.07]">
        <button
          type="button"
          onClick={() => router.push(settingsPath)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-white/15 bg-white/5 text-[#aaa] hover:text-white transition-colors"
        >
          <X className="size-3.5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#d4ff6b]">
            <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
              <path d="M6 1L11 6L6 11L1 6Z" fill="#0e0f0e" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-white leading-none">Aero Edit</p>
            <p className="text-[11px] text-[#666] mt-0.5">A Paddle Demo Brand</p>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {checkoutState === "completed" && (
        <div className="px-5 pt-4">
          <Alert className="border-emerald-500/40 bg-emerald-500/10">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <AlertTitle>{t("completed.title")}</AlertTitle>
            <AlertDescription>{t("completed.description")}</AlertDescription>
          </Alert>
        </div>
      )}

      {errorMessage && (
        <div className="px-5 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{t("errors.title")}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Two-column checkout grid */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="grid lg:grid-cols-[1fr_1.3fr] min-h-[calc(100vh-57px)]"
      >
        {/* ── Left: Order summary ── */}
        <div className="px-10 py-9 border-b lg:border-b-0 lg:border-r border-white/[0.07]">
          <p className="text-[13px] font-medium text-[#888] mb-5 tracking-wide">
            {t("orderSummary.title")}
          </p>

          <div className="flex items-baseline gap-1">
            <span className="text-[42px] font-semibold text-white leading-none tracking-tight">
              TRY 2,257.12
            </span>
            <span className="text-base text-[#888] ml-1">inc. tax</span>
          </div>
          <p className="text-[13px] text-[#666] mt-2">then TRY 2,257.12 monthly</p>

          <p className="text-[13px] text-[#aaa] mt-7 mb-3">{t("orderSummary.seatLabel")}</p>

          {/* Quantity stepper */}
          <div className="flex items-center w-fit rounded-lg border border-white/10 bg-[#1a1b1a] overflow-hidden">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 text-[#aaa] hover:text-white transition-colors"
            >
              <Minus className="size-3.5" />
            </button>
            <div className="w-10 h-10 flex items-center justify-center text-sm font-medium text-white border-x border-white/[0.08]">
              1
            </div>
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 text-[#aaa] hover:text-white transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Line items */}
          <div className="mt-8 pt-6 border-t border-white/[0.07] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888]">{t("orderSummary.subtotal")}</span>
              <span className="text-[13px] font-medium text-[#ccc]">TRY 1,880.93</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#888]">{t("orderSummary.tax")}</span>
              <span className="text-[13px] font-medium text-[#ccc]">TRY 376.19</span>
            </div>
            <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/[0.07]">
              <span className="text-[13px] text-[#888]">{t("orderSummary.dueToday")}</span>
              <span className="text-sm font-semibold text-white">TRY 2,257.12</span>
            </div>
          </div>
        </div>

        {/* ── Right: Paddle checkout frame ── */}
        <div className="px-10 py-9">
          <p className="text-[13px] font-medium text-[#888] mb-5 tracking-wide">
            {t("paymentDetails.title")}
          </p>

          <div className="relative min-h-[640px]">
            {/* Loading skeleton */}
            {isLoadingCheckout && (
              <div className="absolute inset-0 z-10 bg-[#0e0f0e]">
                <CheckoutSkeleton />
              </div>
            )}

            {/* Paddle injects its iframe here */}
            <div
              className={cn(
                "paddle-checkout-frame min-h-[640px]",
                isLoadingCheckout && "opacity-0"
              )}
            />

            {/* Resume / retry footer */}
            {(checkoutState === "error" || checkoutState === "paused") && (
              <div className="border-t border-white/[0.07] pt-4 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-[#ccc] hover:bg-white/10 hover:text-white"
                  onClick={() => void reopenCheckout()}
                >
                  <RefreshCw className="size-4" />
                  {checkoutState === "paused"
                    ? t("actions.resumeCheckout")
                    : t("actions.retryCheckout")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────

function CheckoutSkeleton() {
  return (
    <div className="space-y-5">
      {/* Test mode badge */}
      <div className="flex items-center gap-3">
        <div className="h-5 w-20 animate-pulse rounded bg-[#1c1d1c]" />
        <div className="h-4 w-36 animate-pulse rounded bg-[#1c1d1c]" />
      </div>

      {/* Form fields */}
      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-[#1c1d1c]" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-[#1c1d1c]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 animate-pulse rounded bg-[#1c1d1c]" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-[#1c1d1c]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-20 animate-pulse rounded bg-[#1c1d1c]" />
          <div className="h-24 w-full animate-pulse rounded-lg bg-[#1c1d1c]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-16 animate-pulse rounded bg-[#1c1d1c]" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-[#1c1d1c]" />
        </div>
      </div>

      {/* Discount row */}
      <div className="h-px w-full bg-white/[0.07] my-1" />
      <div className="h-4 w-32 animate-pulse rounded bg-[#1c1d1c]" />
      <div className="h-px w-full bg-white/[0.07] my-1" />

      {/* Subscribe button */}
      <div className="h-12 w-full animate-pulse rounded-lg bg-[#1c1d1c] mt-2" />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readError(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

function isCheckoutResponse(value: unknown): value is BillingCheckoutResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { transactionId?: unknown }).transactionId === "string"
  );
}

function isSyncResponse(value: unknown): value is BillingSyncResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { ok?: unknown }).ok === "boolean" &&
      typeof (value as { outcome?: unknown }).outcome === "string"
  );
}

function isPaddleErrorEvent(event: PaddleEventData): boolean {
  return (
    event.name === "checkout.error" ||
    event.name === "checkout.failed" ||
    event.name === "checkout.payment.error"
  );
}

function readPaddleEventMessage(event: PaddleEventData): string | null {
  const detail = "detail" in event ? event.detail : null;
  return typeof detail === "string" && detail.trim() ? detail : null;
}