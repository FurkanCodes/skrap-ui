import { getTranslations } from "next-intl/server";

import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import { getBillingCurrentQuery } from "@/features/billing/server/queries";
import type { BillingCurrentResponse, BillingPlanKey } from "@/features/billing/types";
import { listSupportedSitesQuery } from "@/features/settings/server/queries";
import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import type { SiteInfoResponse } from "@/features/scraper/types";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { getAuthContext } from "@/lib/auth-dal";

function mapError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

interface SettingsPageProps {
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

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const checkoutPlan = parseCheckoutPlan(params.billing_plan);
  const t = await getTranslations("telegram.errors");
  const settingsT = await getTranslations("settings.errors");
  let initialStatus: TelegramActiveStatusResponse | null = null;
  let initialError: string | null = null;
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
    const [telegramResult, trackedResult, billingResult] = await Promise.allSettled([
      getTelegramStatusQuery(),
      listTrackedItemsQuery(),
      getBillingCurrentQuery(),
    ]);

    if (telegramResult.status === "fulfilled") {
      initialStatus = telegramResult.value;
    } else {
      initialError = mapError(telegramResult.reason, t("loadStatus"));
    }

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
    <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
      <SettingsPageClient
        initialStatus={initialStatus}
        initialError={initialError}
        trackedCount={trackedCount}
        supportedSites={supportedSites}
        supportedSitesError={supportedSitesError}
        initialBilling={billing}
        initialCheckoutPlan={checkoutPlan}
      />
    </div>
  );
}
