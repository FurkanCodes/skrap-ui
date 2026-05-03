"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PaddleEventData } from "@paddle/paddle-js";
import type { CheckoutEventsData } from "@paddle/paddle-js/types/checkout/events";
import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
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

      if (plan) {
        params.set("plan", plan);
      }

      return `${window.location.origin}${returnPath}?${params.toString()}`;
    },
    [plan, returnPath]
  );

  const goToReturn = useCallback(
    (targetTransactionId: string) => {
      const params = new URLSearchParams();
      params.set("transaction_id", targetTransactionId);

      if (plan) {
        params.set("plan", plan);
      }

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
    if (startedRef.current) {
      return;
    }

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

      if (!plan) {
        throw new Error(t("errors.planRequired"));
      }

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

      if (event.data) {
        setCheckoutData(event.data);
      }

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

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [startCheckout]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{t("title")}</h1>
        </div>

        <Button type="button" variant="ghost" onClick={() => router.push(settingsPath)}>
          {t("actions.backToSettings")}
        </Button>
      </header>

      {checkoutState === "completed" ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <AlertTitle>{t("completed.title")}</AlertTitle>
          <AlertDescription>{t("completed.description")}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{t("errors.title")}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="relative min-h-[640px]">
          {isLoadingCheckout ? (
            <div className="absolute inset-0 z-10 bg-card">
              <CheckoutSkeleton />
            </div>
          ) : null}

          <div
            className={cn(
              "paddle-checkout-frame min-h-[640px]",
              isLoadingCheckout && "opacity-0"
            )}
          />

          {checkoutState === "error" || checkoutState === "paused" ? (
            <div className="border-t border-border p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void reopenCheckout();
                }}
              >
                <RefreshCw className="size-4" />
                {checkoutState === "paused"
                  ? t("actions.resumeCheckout")
                  : t("actions.retryCheckout")}
              </Button>
            </div>
          ) : null}
        </div>
      </motion.section>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid min-h-[640px] gap-8 p-6 lg:grid-cols-[0.82fr_1.18fr] lg:p-10">
      <div className="space-y-8">
        <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />

        <div className="space-y-3">
          <div className="h-14 w-72 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-52 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="space-y-4 pt-8">
          <div className="h-5 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-14 w-44 animate-pulse rounded-xl bg-muted" />
        </div>

        <div className="space-y-4 border-t border-border pt-8">
          <div className="flex justify-between">
            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="flex justify-between">
            <div className="h-5 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="flex justify-between border-t border-border pt-6">
            <div className="h-5 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="h-6 w-44 animate-pulse rounded-md bg-muted" />

        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-12 w-full animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}

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

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
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