"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import type { BillingPlanKey } from "@/features/billing/types";
import { isAppLocale, localizePathname } from "@/i18n/paths";

function parseCheckoutPlan(value: string | null): BillingPlanKey | null {
  return value === "plus" || value === "pro" ? value : null;
}

export function SettingsQueryRedirect() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const currentLocale = isAppLocale(locale) ? locale : "en";
  const checkoutPlan = parseCheckoutPlan(searchParams.get("billing_plan"));

  useEffect(() => {
    if (!checkoutPlan) {
      return;
    }

    router.replace(
      `${localizePathname("/billing/checkout", currentLocale)}?plan=${checkoutPlan}`
    );
  }, [checkoutPlan, currentLocale, router]);

  return null;
}
