"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  BillingCheckoutResponse,
  BillingPlanKey,
  BillingSyncResponse,
} from "@/features/billing/types";
import { localizePathname } from "@/i18n/paths";
import type { AppLocale } from "@/i18n/routing";

interface BillingReturnClientProps {
  locale: AppLocale;
  plan: BillingPlanKey | null;
  initialTransactionId: string | null;
  fromPaymentLink: boolean;
  autoStart: boolean;
}

type FlowState =
  | "ready"
  | "opening_checkout"
  | "checkout_open"
  | "syncing"
  | "active"
  | "delayed"
  | "canceled"
  | "error";

export function BillingReturnClient({
  locale,
  plan,
  initialTransactionId,
  fromPaymentLink,
  autoStart,
}: BillingReturnClientProps) {
  const t = useTranslations("billingReturn");
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [flowState, setFlowState] = useState<FlowState>(resolveInitialFlowState(initialTransactionId, autoStart));
  const [transactionId, setTransactionId] = useState<string | null>(initialTransactionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncRun, setSyncRun] = useState(initialTransactionId ? 1 : 0);
  const startedCheckoutRef = useRef(false);
  const openedFromPaymentLinkRef = useRef(false);

  const returnPath = useMemo(() => localizePathname("/billing/return", locale), [locale]);
  const settingsPath = useMemo(() => localizePathname("/settings", locale), [locale]);

  const buildReturnQuery = useCallback((nextTransactionId: string): string => {
    const params = new URLSearchParams();
    params.set("transaction_id", nextTransactionId);
    if (plan) {
      params.set("plan", plan);
    }
    return `${returnPath}?${params.toString()}`;
  }, [plan, returnPath]);

  const openCheckout = useCallback(async (nextTransactionId: string): Promise<boolean> => {
    setErrorMessage(null);
    setFlowState("opening_checkout");

    const response = await fetch("/api/billing/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionId: nextTransactionId }),
    });
    const payload = await readJson(response);
    if (isSyncResponse(payload) && payload.checkoutUrl) {
      window.location.assign(payload.checkoutUrl);
      return true;
    }

    const returnUrl = `${window.location.origin}${buildReturnQuery(nextTransactionId)}`;
    setErrorMessage(
      response.status === 409
        ? t("errors.hostedCheckoutUnavailable")
        : readError(payload, t("errors.openCheckout"))
    );
    setFlowState("error");
    console.warn("[billing-return]", {
      outcome: "hosted_checkout_unavailable",
      transactionId: nextTransactionId,
      returnUrl,
    });
    return false;
  }, [buildReturnQuery, t]);

  const startCheckout = useCallback(async () => {
    if (!plan) {
      setErrorMessage(t("errors.planRequired"));
      setFlowState("error");
      return;
    }

    if (startedCheckoutRef.current) {
      return;
    }
    startedCheckoutRef.current = true;
    setErrorMessage(null);
    setFlowState("opening_checkout");

    let checkoutPayload: BillingCheckoutResponse | null = null;
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planKey: plan }),
      });
      if (response.status === 401) {
        const signInPath = localizePathname("/auth/sign-in", locale);
        const currentPath = `${returnPath}?plan=${plan}&start=1`;
        router.push(`${signInPath}?next=${encodeURIComponent(currentPath)}`);
        return;
      }
      const payload = await readJson(response);
      if (!response.ok || !isCheckoutResponse(payload)) {
        throw new Error(readError(payload, t("errors.startCheckout")));
      }
      checkoutPayload = payload;
      setTransactionId(payload.transactionId);
      if (payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl);
        return;
      }
      await openCheckout(payload.transactionId);
    } catch (error) {
      if (checkoutPayload?.checkoutUrl) {
        window.location.assign(checkoutPayload.checkoutUrl);
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : t("errors.startCheckout"));
      setFlowState("error");
      startedCheckoutRef.current = false;
    }
  }, [locale, openCheckout, plan, returnPath, router, t]);

  const syncTransaction = useCallback(async (targetTransactionId: string, allowReopen: boolean) => {
    setErrorMessage(null);
    setFlowState("syncing");
    let delayMs = 1200;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch("/api/billing/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ transactionId: targetTransactionId }),
      });
      const payload = await readJson(response);
      if (response.ok && isSyncResponse(payload) && payload.ok) {
        await fetch("/api/billing/current", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        setFlowState("active");
        router.refresh();
        return;
      }

      if (response.status === 409) {
        const syncPayload = isSyncResponse(payload) ? payload : null;
        const outcome = syncPayload?.outcome ?? null;
        const checkoutUrl = syncPayload?.checkoutUrl ?? null;
        if (
          allowReopen &&
          outcome === "pending" &&
          !openedFromPaymentLinkRef.current
        ) {
          openedFromPaymentLinkRef.current = true;
          if (checkoutUrl) {
            window.location.assign(checkoutUrl);
            return;
          }
          await openCheckout(targetTransactionId);
          return;
        }
        setFlowState(outcome === "pending" ? "checkout_open" : "syncing");
        await wait(delayMs);
        delayMs = Math.min(5000, Math.round(delayMs * 1.4));
        continue;
      }

      const detail = readError(payload, t("errors.syncFailed"));
      if (response.status === 401 || response.status === 403 || response.status === 422) {
        setErrorMessage(detail);
        setFlowState("error");
        return;
      }

      if (attempt < 11) {
        await wait(delayMs);
        delayMs = Math.min(5000, Math.round(delayMs * 1.4));
        continue;
      }

      setErrorMessage(detail);
      setFlowState("delayed");
      return;
    }

    setFlowState("delayed");
  }, [openCheckout, router, t]);

  useEffect(() => {
    if (!autoStart || transactionId || !plan || startedCheckoutRef.current) {
      return;
    }
    void startCheckout();
  }, [autoStart, plan, startCheckout, transactionId]);

  useEffect(() => {
    if (!transactionId || syncRun <= 0) {
      return;
    }
    const allowReopen = fromPaymentLink;
    const timeoutId = window.setTimeout(() => {
      void syncTransaction(transactionId, allowReopen);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fromPaymentLink, syncRun, syncTransaction, transactionId]);

  return (
    <Card className="rounded-lg border-border bg-card">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
          className="rounded-md border border-border bg-muted/20 p-4"
        >
          <p className="text-sm font-semibold text-foreground">{t(`states.${flowState}.title`)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t(`states.${flowState}.description`)}</p>
          {transactionId ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              {t("transactionId", { value: transactionId })}
            </p>
          ) : null}
        </motion.div>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>{t("errors.title")}</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {(flowState === "ready" || flowState === "canceled" || flowState === "error") && plan ? (
            <Button type="button" onClick={() => { void startCheckout(); }}>
              <ExternalLink className="size-4" />
              {t("actions.startCheckout")}
            </Button>
          ) : null}

          {transactionId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void openCheckout(transactionId);
              }}
            >
              <ExternalLink className="size-4" />
              {t("actions.openCheckout")}
            </Button>
          ) : null}

          {transactionId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSyncRun((value) => value + 1);
              }}
            >
              <RefreshCw className="size-4" />
              {t("actions.retrySync")}
            </Button>
          ) : null}

          <Button type="button" variant="ghost" onClick={() => router.push(settingsPath)}>
            {t("actions.goSettings")}
          </Button>
        </div>

        {flowState === "syncing" || flowState === "opening_checkout" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("status.processing")}
          </div>
        ) : null}

        {flowState === "checkout_open" ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="size-4" />
            {t("status.completeInCheckout")}
          </div>
        ) : null}

        {flowState === "active" ? (
          <div className="flex items-center gap-2 text-xs text-emerald-600">
            <CheckCircle2 className="size-4" />
            {t("status.active")}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function resolveInitialFlowState(
  initialTransactionId: string | null,
  autoStart: boolean
): FlowState {
  if (initialTransactionId) {
    return "syncing";
  }
  if (autoStart) {
    return "opening_checkout";
  }
  return "ready";
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
