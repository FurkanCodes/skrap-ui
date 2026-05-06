"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { TrackersDashboard } from "@/features/tracking/components/trackers-dashboard";
import { isAppLocale, localizePathname } from "@/i18n/paths";

function parseCheckoutPlan(value: string | null): "plus" | "pro" | null {
  return value === "plus" || value === "pro" ? value : null;
}

export function DashboardPageClient() {
  const router = useRouter();
  const locale = "en";
  const searchParams = useSearchParams();
  const currentLocale = isAppLocale(locale) ? locale : "en";
  const checkoutPlan = parseCheckoutPlan(searchParams.get("billing_plan"));
  const highlightedTrackerId = searchParams.get("tracker");

  useEffect(() => {
    if (!checkoutPlan) {
      return;
    }

    router.replace(
      `${localizePathname("/billing/checkout", currentLocale)}?plan=${checkoutPlan}`
    );
  }, [checkoutPlan, currentLocale, router]);

  if (checkoutPlan) {
    return <DashboardRouteFallback />;
  }

  return <TrackersDashboard highlightedTrackerId={highlightedTrackerId} />;
}

export function DashboardRouteFallback() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="h-20 rounded-lg bg-muted/45" />
        <div className="h-20 rounded-lg bg-muted/35" />
        <div className="h-20 rounded-lg bg-muted/30" />
      </div>
      <div className="h-10 rounded-lg bg-muted/35" />
      <div className="space-y-2">
        <div className="h-16 rounded-lg bg-muted/30" />
        <div className="h-16 rounded-lg bg-muted/25" />
        <div className="h-16 rounded-lg bg-muted/20" />
      </div>
    </div>
  );
}
