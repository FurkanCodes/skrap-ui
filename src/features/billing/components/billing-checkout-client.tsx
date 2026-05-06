"use client";

import { getMessages } from "@/lib/messages";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PaddleEventData } from "@paddle/paddle-js";
import type { CheckoutEventsData } from "@paddle/paddle-js/types/checkout/events";
import {
  IconAlertCircle,
  IconCircleCheck,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

type MoneyValue = number | string | null | undefined;

type CheckoutTotalsLike = {
  subtotal?: MoneyValue;
  tax?: MoneyValue;
  total?: MoneyValue;
};

type CheckoutBillingCycleLike = {
  interval?: string | null;
  frequency?: number | string | null;
};

type CheckoutItemLike = {
  quantity?: number | string | null;
  price_name?: string | null;
  product?: {
    name?: string | null;
  } | null;
  totals?: CheckoutTotalsLike | null;
  recurring_totals?: CheckoutTotalsLike | null;
  billing_cycle?: CheckoutBillingCycleLike | null;
};

type CheckoutDataLike = {
  currency_code?: string | null;
  totals?: CheckoutTotalsLike | null;
  recurring_totals?: CheckoutTotalsLike | null;
  items?: CheckoutItemLike[] | null;
};

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

export function BillingCheckoutClient({
  locale,
  plan,
  paymentLinkTransactionId,
}: BillingCheckoutClientProps) {
  const t = getMessages("billingCheckout");
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

  const parsedCheckoutData = checkoutData as CheckoutDataLike | null;
  const currencyCode = parsedCheckoutData?.currency_code ?? null;

  const aggregatedFromItems = aggregateItemTotals(parsedCheckoutData?.items);

  const subtotalAmount = firstDefinedNumberLike(
    parsedCheckoutData?.totals?.subtotal,
    aggregatedFromItems.subtotal
  );

  const taxAmount = firstDefinedNumberLike(
    parsedCheckoutData?.totals?.tax,
    aggregatedFromItems.tax
  );

  const dueTodayAmount = firstDefinedNumberLike(
    parsedCheckoutData?.totals?.total,
    aggregatedFromItems.total
  );

  const recurringTotalAmount = firstDefinedNumberLike(
    parsedCheckoutData?.recurring_totals?.total,
    aggregatedFromItems.recurringTotal
  );

  const subtotal = formatCheckoutMoney(subtotalAmount, currencyCode, locale);
  const tax = formatCheckoutMoney(taxAmount, currencyCode, locale);
  const dueToday = formatCheckoutMoney(dueTodayAmount, currencyCode, locale);
  const recurringTotal = formatCheckoutMoney(recurringTotalAmount, currencyCode, locale);

  const quantity = getCheckoutQuantity(parsedCheckoutData?.items);
  const selectedPlanLabel = getSelectedPlanLabel(parsedCheckoutData?.items, plan);
  const recurringCycle = getRecurringCycle(parsedCheckoutData?.items);

  const recurringDescription = recurringTotal
    ? recurringCycle
      ? t("summary.thenRecurring", {
          amount: recurringTotal,
          period: formatRecurringPeriod(t, recurringCycle),
        })
      : t("summary.thenRecurringDefault", { amount: recurringTotal })
    : t("summary.description");

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
            theme: "light",
            allowLogout: false,
            frameTarget: "paddle-checkout-frame",
            frameInitialHeight: 760,
            frameStyle:
              "width: 100%; min-height: 760px; background-color: #ffffff; border: 0;",
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
    [buildReturnUrl, setCheckoutState, setErrorMessage, t]
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
  }, [setCheckoutUrl]);

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
  }, [
    checkoutUrl,
    openInlineCheckout,
    paymentLinkTransactionId,
    plan,
    setCheckoutData,
    setCheckoutState,
    setCheckoutUrl,
    setErrorMessage,
    setTransactionId,
    t,
  ]);

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
    setCheckoutData,
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

    return () => window.clearTimeout(timeoutId);
  }, [startCheckout]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 font-sans">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-6 py-4">
          <button
            type="button"
            onClick={() => router.push(settingsPath)}
            aria-label={t("actions.backToSettings")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <IconX className="size-4" stroke={1.5} />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M6 1L11 6L6 11L1 6Z" fill="currentColor" />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold leading-none text-slate-900">
                {t("brand.name")}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{t("brand.tagline")}</p>
            </div>
          </div>
        </div>
      </header>

      {checkoutState === "completed" && (
        <div className="mx-auto max-w-[1440px] px-6 pt-6">
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900">
            <IconCircleCheck className="size-4 text-emerald-600" stroke={1.5} />
            <AlertTitle>{t("completed.title")}</AlertTitle>
            <AlertDescription>{t("completed.description")}</AlertDescription>
          </Alert>
        </div>
      )}

      {errorMessage && (
        <div className="mx-auto max-w-[1440px] px-6 pt-6">
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" stroke={1.5} />
            <AlertTitle>{t("errors.title")}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className="mx-auto grid max-w-[1440px] gap-8 px-6 py-6 lg:grid-cols-[380px_minmax(0,1fr)]"
      >
        <aside>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t("summary.title")}</p>

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-[48px] font-semibold leading-none tracking-tight text-slate-900">
                {dueToday ?? t("summary.awaitingPrice")}
              </span>

              {dueToday && (
                <span className="text-base text-slate-500">{t("summary.incTax")}</span>
              )}
            </div>

            <p className="mt-3 text-[15px] leading-7 text-slate-500">{recurringDescription}</p>

            <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                {t("summary.selectedPlan")}
              </p>

              <p className="mt-2 text-[32px] font-semibold leading-none text-slate-900">
                {selectedPlanLabel}
              </p>

              {transactionId && (
                <p className="mt-4 break-all text-sm text-slate-500">
                  {t("summary.transactionId", { value: transactionId })}
                </p>
              )}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-[15px] text-slate-600">{t("summary.seatLabel")}</p>

              <div className="flex w-fit items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  type="button"
                  disabled
                  aria-label={t("quantity.decrease")}
                  className="flex h-14 w-14 items-center justify-center text-slate-400"
                >
                  <IconMinus className="size-4" stroke={1.5} />
                </button>

                <div className="flex h-14 w-14 items-center justify-center border-x border-slate-200 text-lg font-medium text-slate-900">
                  {quantity ?? 1}
                </div>

                <button
                  type="button"
                  disabled
                  aria-label={t("quantity.increase")}
                  className="flex h-14 w-14 items-center justify-center text-slate-400"
                >
                  <IconPlus className="size-4" stroke={1.5} />
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-slate-500">{t("summary.subtotal")}</span>
                <span className="text-[15px] font-medium text-slate-900">
                  {subtotal ?? t("summary.confirmInCheckout")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[15px] text-slate-500">{t("summary.tax")}</span>
                <span className="text-[15px] font-medium text-slate-900">
                  {tax ?? t("summary.confirmInCheckout")}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-[15px] text-slate-500">{t("summary.dueToday")}</span>
                <span className="text-lg font-semibold text-slate-900">
                  {dueToday ?? t("summary.confirmInCheckout")}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-[15px] text-slate-500">{t("summary.status")}</span>
                <span className="text-[15px] font-medium text-slate-900">
                  {formatCheckoutState(t, checkoutState)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm leading-6 text-slate-500">{t("summary.secure")}</p>
              </div>
            </div>
          </div>
        </aside>

        <main>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-500">{t("payment.title")}</p>
              <p className="mt-1 text-[15px] text-slate-500">{t("payment.description")}</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4">
              <div className="relative min-h-[760px]">
                {isLoadingCheckout && (
                  <div className="absolute inset-0 z-10 rounded-[20px] bg-white">
                    <CheckoutSkeleton label={t("payment.loading")} />
                  </div>
                )}

                <div
                  className={cn(
                    "paddle-checkout-frame min-h-[760px]",
                    isLoadingCheckout && "opacity-0"
                  )}
                />

                {(checkoutState === "error" || checkoutState === "paused") && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                      onClick={() => void reopenCheckout()}
                    >
                      <IconRefresh className="size-4" stroke={1.5} />
                      {checkoutState === "paused"
                        ? t("actions.resumeCheckout")
                        : t("actions.retryCheckout")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </motion.div>
    </div>
  );
}

function CheckoutSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-5 rounded-[20px] bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-20 rounded-full bg-bg-a1" />
        <p className="text-sm font-medium text-fg-1">{label}</p>
      </div>

      <div className="space-y-4 pt-1">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-24 w-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="my-1 h-px w-full bg-border" />
      <Skeleton className="h-4 w-32 rounded-full" />
      <div className="my-1 h-px w-full bg-border" />
      <Skeleton className="mt-2 h-11 w-full rounded-full bg-bg-a1" />
    </div>
  );
}

function aggregateItemTotals(items: CheckoutItemLike[] | null | undefined) {
  if (!items?.length) {
    return {
      subtotal: null as number | null,
      tax: null as number | null,
      total: null as number | null,
      recurringTotal: null as number | null,
    };
  }

  let subtotal = 0;
  let tax = 0;
  let total = 0;
  let recurringTotal = 0;

  let hasSubtotal = false;
  let hasTax = false;
  let hasTotal = false;
  let hasRecurringTotal = false;

  for (const item of items) {
    const itemSubtotal = toNumber(item.totals?.subtotal);
    const itemTax = toNumber(item.totals?.tax);
    const itemTotal = toNumber(item.totals?.total);
    const itemRecurringTotal = toNumber(item.recurring_totals?.total);

    if (itemSubtotal !== null) {
      subtotal += itemSubtotal;
      hasSubtotal = true;
    }

    if (itemTax !== null) {
      tax += itemTax;
      hasTax = true;
    }

    if (itemTotal !== null) {
      total += itemTotal;
      hasTotal = true;
    }

    if (itemRecurringTotal !== null) {
      recurringTotal += itemRecurringTotal;
      hasRecurringTotal = true;
    }
  }

  return {
    subtotal: hasSubtotal ? subtotal : null,
    tax: hasTax ? tax : null,
    total: hasTotal ? total : null,
    recurringTotal: hasRecurringTotal ? recurringTotal : null,
  };
}

function getCheckoutQuantity(items: CheckoutItemLike[] | null | undefined): number | null {
  if (!items?.length) return null;

  let totalQuantity = 0;
  let found = false;

  for (const item of items) {
    const value = toNumber(item.quantity);
    if (value !== null) {
      totalQuantity += value;
      found = true;
    }
  }

  return found ? totalQuantity : null;
}

function getSelectedPlanLabel(
  items: CheckoutItemLike[] | null | undefined,
  plan: BillingPlanKey | null
): string {
  const firstItem = items?.[0];

  const productName = firstItem?.product?.name?.trim();
  if (productName) return productName;

  const priceName = firstItem?.price_name?.trim();
  if (priceName) return priceName;

  if (!plan) return "—";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function getRecurringCycle(
  items: CheckoutItemLike[] | null | undefined
): CheckoutBillingCycleLike | null {
  if (!items?.length) return null;

  for (const item of items) {
    if (item.billing_cycle?.interval) return item.billing_cycle;
  }

  return null;
}

function formatRecurringPeriod(
  t: TranslationFn,
  billingCycle: CheckoutBillingCycleLike
): string {
  const countRaw = toNumber(billingCycle.frequency);
  const count = countRaw && countRaw > 0 ? countRaw : 1;

  switch (billingCycle.interval) {
    case "day":
      return t("intervals.day", { count });
    case "week":
      return t("intervals.week", { count });
    case "month":
      return t("intervals.month", { count });
    case "year":
      return t("intervals.year", { count });
    default:
      return t("intervals.billingPeriod");
  }
}

function formatCheckoutState(t: TranslationFn, state: CheckoutState): string {
  switch (state) {
    case "preparing":
      return t("states.preparing");
    case "ready":
      return t("states.ready");
    case "completed":
      return t("states.completed");
    case "paused":
      return t("states.paused");
    case "error":
      return t("states.error");
    default:
      return t("states.preparing");
  }
}

function formatCheckoutMoney(
  amount: MoneyValue,
  currencyCode: string | null | undefined,
  locale: AppLocale
): string | null {
  const numericAmount = toNumber(amount);

  if (numericAmount === null || !currencyCode) return null;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function toNumber(value: MoneyValue): number | null {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function firstDefinedNumberLike(...values: MoneyValue[]): number | null {
  for (const value of values) {
    const numeric = toNumber(value);
    if (numeric !== null) return numeric;
  }

  return null;
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
