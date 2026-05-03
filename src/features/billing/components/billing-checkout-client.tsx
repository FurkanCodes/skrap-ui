"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PaddleEventData } from "@paddle/paddle-js";
import type { CheckoutEventsData } from "@paddle/paddle-js/types/checkout/events";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MARKETING_PRICING_PLANS } from "@/components/shadcn-space/blocks/pricing-content";
import { loadPaddle, subscribePaddleEvents } from "@/features/billing/client/paddle-js";
import type { BillingCheckoutResponse, BillingPlanKey, BillingSyncResponse } from "@/features/billing/types";
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

  const planDetails = useMemo(() => (plan ? getPlanDetails(plan) : null), [plan]);
  const returnPath = useMemo(() => localizePathname("/billing/return", locale), [locale]);
  const settingsPath = useMemo(() => localizePathname("/settings", locale), [locale]);

  const buildReturnUrl = useCallback((targetTransactionId: string) => {
    const params = new URLSearchParams();
    params.set("transaction_id", targetTransactionId);
    if (plan) {
      params.set("plan", plan);
    }
    return `${window.location.origin}${returnPath}?${params.toString()}`;
  }, [plan, returnPath]);

  const goToReturn = useCallback((targetTransactionId: string) => {
    const params = new URLSearchParams();
    params.set("transaction_id", targetTransactionId);
    if (plan) {
      params.set("plan", plan);
    }
    router.replace(`${returnPath}?${params.toString()}`, { scroll: false });
  }, [plan, returnPath, router]);

  const openInlineCheckout = useCallback(async (
    targetTransactionId: string,
    hostedCheckoutUrl?: string | null
  ) => {
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
          frameInitialHeight: 560,
          frameStyle: "width: 100%; min-height: 560px; background-color: transparent; border: none;",
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
  }, [buildReturnUrl, t]);

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
      if (event.data) {
        const eventTransactionId = event.data.transaction_id;
        if (!transactionIdRef.current || eventTransactionId === transactionIdRef.current) {
          setCheckoutData(event.data);
        }
      }

      const eventTransactionId = event.data?.transaction_id;
      if (
        eventTransactionId &&
        transactionIdRef.current &&
        eventTransactionId !== transactionIdRef.current
      ) {
        return;
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

  const total = checkoutData?.totals?.total ?? null;
  const currencyCode = checkoutData?.currency_code ?? "USD";
  const primaryItem = checkoutData?.items?.[0] ?? null;
  const summaryName = primaryItem?.product.name ?? planDetails?.name ?? t("summary.selectedPlan");
  const summaryPrice = total === null
    ? planDetails?.price ?? t("summary.awaitingPrice")
    : formatCheckoutAmount(total, currencyCode, locale);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("eyebrow")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => router.push(settingsPath)}>
            {t("actions.backToSettings")}
          </Button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(420px,1fr)]">
        <motion.aside
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="space-y-4"
        >
          <Card className="rounded-lg border-border bg-card">
            <CardHeader>
              <CardTitle>{t("summary.title")}</CardTitle>
              <CardDescription>{t("summary.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{summaryName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {planDetails?.trackers ?? t("summary.paymentLink")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{summaryPrice}</p>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                  <div className="flex justify-between gap-3">
                    <span>{t("summary.credits")}</span>
                    <span className="font-medium text-foreground">
                      {planDetails?.credits ?? t("summary.confirmInCheckout")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>{t("summary.status")}</span>
                    <span className={cn("font-medium", statusClassName(checkoutState))}>
                      {t(`states.${checkoutState}`)}
                    </span>
                  </div>
                </div>
              </div>

              {transactionId ? (
                <div className="rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                  {t("summary.transactionId", { value: transactionId })}
                </div>
              ) : null}

              <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 p-3">
                <LockKeyhole className="mt-0.5 size-4 text-muted-foreground" />
                <p className="text-xs leading-5 text-muted-foreground">{t("summary.secure")}</p>
              </div>
            </CardContent>
          </Card>

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
        </motion.aside>

        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18, delay: 0.04 }}
          className="rounded-lg border border-border bg-card p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">{t("payment.title")}</h2>
              <p className="text-xs text-muted-foreground">{t("payment.description")}</p>
            </div>
            {checkoutState === "preparing" ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {t("payment.loading")}
              </div>
            ) : null}
          </div>

          <div className="min-h-[560px] overflow-hidden rounded-md border border-border bg-background">
            <div className="paddle-checkout-frame min-h-[560px]" />
            {checkoutState === "error" || checkoutState === "paused" ? (
              <div className="border-t border-border p-4">
                <Button type="button" variant="outline" onClick={() => { void reopenCheckout(); }}>
                  <RefreshCw className="size-4" />
                  {checkoutState === "paused" ? t("actions.resumeCheckout") : t("actions.retryCheckout")}
                </Button>
              </div>
            ) : null}
          </div>
        </motion.section>
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

function formatCheckoutAmount(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

function statusClassName(state: CheckoutState): string {
  if (state === "completed") {
    return "text-emerald-600";
  }
  if (state === "error") {
    return "text-destructive";
  }
  return "text-foreground";
}

function getPlanDetails(planKey: BillingPlanKey): {
  name: string;
  price: string;
  trackers: string;
  credits: string;
} | null {
  const plan = MARKETING_PRICING_PLANS.find((item) => item.planKey === planKey);
  if (!plan) {
    return null;
  }
  return {
    name: plan.name,
    price: `$${plan.price} / month`,
    credits: plan.features[0] ?? "Shown in checkout",
    trackers: plan.features[1] ?? "Shown in checkout",
  };
}
