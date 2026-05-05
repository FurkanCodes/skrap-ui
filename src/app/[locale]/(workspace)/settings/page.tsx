import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import { getBillingCurrentQuery } from "@/features/billing/server/queries";
import type { BillingCurrentResponse, BillingPlanKey } from "@/features/billing/types";
import { listSupportedSitesQuery } from "@/features/settings/server/queries";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import type { SiteInfoResponse } from "@/features/scraper/types";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { getAuthContext } from "@/lib/auth-dal";

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

  const settingsT = await getTranslations("settings.errors");
  let trackedCount = 0;
  let supportedSites: SiteInfoResponse[] = [];
  let supportedSitesError: string | null = null;
  let billing: BillingCurrentResponse | null = null;

  const authPromise = getAuthContext();
  const supportedSitesPromise = listSupportedSitesQuery();
  const auth = await authPromise;

  const [supportedSitesResult] = await Promise.allSettled([supportedSitesPromise]);
  if (supportedSitesResult.status === "fulfilled") {
    supportedSites = supportedSitesResult.value;
  } else {
    supportedSitesError = settingsT("supportedSites");
  }

  if (auth) {
    const [trackedResult, billingResult] = await Promise.allSettled([
      listTrackedItemsQuery(),
      getBillingCurrentQuery(),
    ]);

    if (trackedResult.status === "fulfilled") {
      trackedCount = trackedResult.value.items.length;
    } else {
      trackedCount = 0;
    }

    if (billingResult.status === "fulfilled") {
      billing = billingResult.value;
    }
  }
  return (
    <SettingsPageClient
      trackedCount={trackedCount}
      supportedSites={supportedSites}
      supportedSitesError={supportedSitesError}
      initialBilling={billing}
    />
  );
}
