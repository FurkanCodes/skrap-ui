import { redirect } from "next/navigation";

import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import type { BillingPlanKey } from "@/features/billing/types";
import { isAppLocale, localizePathname } from "@/i18n/paths";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    billing_plan?: string | string[];
  }>;
}

function parseCheckoutPlan(
  rawPlan: string | string[] | undefined
): BillingPlanKey | null {
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  return plan === "plus" || plan === "pro" ? plan : null;
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const [{ locale }, queryParams] = await Promise.all([params, searchParams]);
  const checkoutPlan = parseCheckoutPlan(queryParams.billing_plan);
  const currentLocale = isAppLocale(locale) ? locale : "en";
  if (checkoutPlan) {
    redirect(`${localizePathname("/billing/checkout", currentLocale)}?plan=${checkoutPlan}`);
  }

  return <SettingsPageClient />;
}
