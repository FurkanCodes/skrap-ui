import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BillingCheckoutClient } from "@/features/billing/components/billing-checkout-client";
import type { BillingPlanKey } from "@/features/billing/types";
import { localizePathname } from "@/i18n/paths";
import type { AppLocale } from "@/i18n/routing";
import { getAuthContext } from "@/lib/auth-dal";
import { getMessages } from "@/lib/messages";
import { cn } from "@/lib/utils";

interface BillingCheckoutPageProps {
  searchParams: Promise<{
    plan?: string | string[];
    _ptxn?: string | string[];
  }>;
}

export default async function BillingCheckoutPage({ searchParams }: BillingCheckoutPageProps) {
  const [query, auth] = await Promise.all([searchParams, getAuthContext()]);
  const currentLocale: AppLocale = "en";
  const t = getMessages("billingCheckout");
  const plan = parsePlan(query.plan);
  const paymentLinkTransactionId = parseTransactionId(query._ptxn);

  if (!auth) {
    const checkoutPath = localizePathname("/billing/checkout", currentLocale);
    const paramsForNext = new URLSearchParams();
    if (plan) {
      paramsForNext.set("plan", plan);
    }
    if (paymentLinkTransactionId) {
      paramsForNext.set("_ptxn", paymentLinkTransactionId);
    }
    const nextPath = paramsForNext.toString()
      ? `${checkoutPath}?${paramsForNext.toString()}`
      : checkoutPath;
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

  if (!plan && !paymentLinkTransactionId) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center p-6">
        <Card className="w-full rounded-lg border-border bg-card">
          <CardHeader>
            <CardTitle>{t("missing.title")}</CardTitle>
            <CardDescription>{t("missing.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={localizePathname("/settings", currentLocale)}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              {t("missing.goSettings")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
      <BillingCheckoutClient
        locale={currentLocale}
        plan={plan}
        paymentLinkTransactionId={paymentLinkTransactionId}
      />
    </div>
  );
}

function parsePlan(value: string | string[] | undefined): BillingPlanKey | null {
  const plan = Array.isArray(value) ? value[0] : value;
  return plan === "plus" || plan === "pro" ? plan : null;
}

function parseTransactionId(value: string | string[] | undefined): string | null {
  const parsed = (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
  return parsed.startsWith("txn_") ? parsed : null;
}
