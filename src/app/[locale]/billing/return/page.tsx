import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingReturnClient } from "@/features/billing/components/billing-return-client";
import type { BillingPlanKey } from "@/features/billing/types";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/lib/auth-dal";

interface BillingReturnPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    plan?: string | string[];
    start?: string | string[];
    transaction_id?: string | string[];
    _ptxn?: string | string[];
  }>;
}

export default async function BillingReturnPage({ params, searchParams }: BillingReturnPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const currentLocale = (isAppLocale(locale) ? locale : "en") as AppLocale;
  const t = await getTranslations("billingReturn");
  const plan = parsePlan(query.plan);
  const autoStart = parseFlag(query.start);
  const transactionId = parseTransactionId(query.transaction_id);
  const paymentLinkTransactionId = parseTransactionId(query._ptxn);
  const activeTransactionId = transactionId ?? paymentLinkTransactionId;
  const fromPaymentLink = !transactionId && Boolean(paymentLinkTransactionId);
  const auth = await getAuthContext();

  if ((autoStart && plan) || paymentLinkTransactionId) {
    const checkoutPath = localizePathname("/billing/checkout", currentLocale);
    const paramsForCheckout = new URLSearchParams();
    if (plan) {
      paramsForCheckout.set("plan", plan);
    }
    if (paymentLinkTransactionId) {
      paramsForCheckout.set("_ptxn", paymentLinkTransactionId);
    }
    redirect(`${checkoutPath}?${paramsForCheckout.toString()}`);
  }

  if (!auth) {
    const returnPath = localizePathname("/billing/return", currentLocale);
    const paramsForNext = new URLSearchParams();
    if (plan) {
      paramsForNext.set("plan", plan);
    }
    if (autoStart) {
      paramsForNext.set("start", "1");
    }
    if (transactionId) {
      paramsForNext.set("transaction_id", transactionId);
    }
    if (paymentLinkTransactionId) {
      paramsForNext.set("_ptxn", paymentLinkTransactionId);
    }
    const nextPath = paramsForNext.toString()
      ? `${returnPath}?${paramsForNext.toString()}`
      : returnPath;
    const signInPath = localizePathname("/auth/sign-in", currentLocale);

    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center p-6">
        <Card className="w-full rounded-lg border-border bg-card">
          <CardHeader>
            <CardTitle>{t("auth.title")}</CardTitle>
            <CardDescription>{t("auth.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`${signInPath}?next=${encodeURIComponent(nextPath)}`}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              {t("auth.signIn")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
      <BillingReturnClient
        locale={currentLocale}
        plan={plan}
        initialTransactionId={activeTransactionId}
        fromPaymentLink={fromPaymentLink}
        autoStart={autoStart}
      />
    </div>
  );
}

function parsePlan(value: string | string[] | undefined): BillingPlanKey | null {
  const plan = Array.isArray(value) ? value[0] : value;
  return plan === "plus" || plan === "pro" ? plan : null;
}

function parseFlag(value: string | string[] | undefined): boolean {
  const parsed = Array.isArray(value) ? value[0] : value;
  return parsed === "1";
}

function parseTransactionId(value: string | string[] | undefined): string | null {
  const parsed = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return parsed.startsWith("txn_") ? parsed : null;
}
