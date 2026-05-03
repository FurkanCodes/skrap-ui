"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bell, Clock3, Laptop, Moon, Sun, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageBillingButton } from "@/features/billing/components/manage-billing-button";
import { PaddleCheckoutButton } from "@/features/billing/components/paddle-checkout-button";
import type { BillingCurrentResponse, BillingPlanKey } from "@/features/billing/types";
import type { SiteInfoResponse } from "@/features/scraper/types";
import { TelegramLinkCard } from "@/features/telegram/components/telegram-link-card";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { resolveEffectiveMinIntervalMinutes } from "@/features/tracking/interval-policy";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

interface SettingsPageClientProps {
  initialStatus: TelegramActiveStatusResponse | null;
  initialError: string | null;
  trackedCount: number;
  supportedSites: SiteInfoResponse[];
  supportedSitesError: string | null;
  initialBilling: BillingCurrentResponse | null;
  initialCheckoutPlan: BillingPlanKey | null;
}

const PAID_ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

function formatCount(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

function formatMinimumInterval(value: number): string {
  if (value < 60) {
    return `${value}m`;
  }
  if (value % 60 === 0) {
    const hours = value / 60;
    return `${hours}h`;
  }
  return `${value}m`;
}

function formatPeriodEnd(value: string | null, locale: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatSiteKey(siteKey: string): string {
  return siteKey
    .split(/[-_]/g)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function SettingsPageClient({
  initialStatus,
  initialError,
  trackedCount,
  supportedSites,
  supportedSitesError,
  initialBilling,
  initialCheckoutPlan,
}: SettingsPageClientProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { isAuthenticated, me, refreshViewer } = useViewer();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [dailySummary, setDailySummary] = useState(true);
  const [muteWeekends, setMuteWeekends] = useState(false);
  const [minimumDrop, setMinimumDrop] = useState("1");
  const [pendingCheckoutPlan, setPendingCheckoutPlan] = useState<BillingPlanKey | null>(
    initialCheckoutPlan
  );
  const [mounted, setMounted] = useState(false);
  const minimumDropOptions = [
    { value: "1", label: "1%" },
    { value: "3", label: "3%" },
    { value: "5", label: "5%" },
    { value: "10", label: "10%" },
  ];
  const activeTheme = mounted ? theme : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = resolveEffectiveMinIntervalMinutes({
    planKey: me?.entitlement.plan_key,
    entitlementMinIntervalMinutes: Number(me?.entitlement.min_check_interval_minutes),
  });
  const monthlyCredits = Math.max(
    0,
    Number(me?.usage?.monthly_check_units ?? me?.entitlement.monthly_check_units) || 0
  );
  const consumedCredits = Math.max(0, Number(me?.usage?.consumed_check_units) || 0);
  const remainingCredits = Math.max(
    0,
    Number(me?.usage?.remaining_check_units ?? monthlyCredits - consumedCredits) || 0
  );
  const cycleResetLabel = formatPeriodEnd(me?.usage?.period_end ?? null, locale);
  const planKey = me?.entitlement.plan_key ?? "free";
  const hasPaidEntitlement = planKey !== "free";
  const billingSubscription = initialBilling?.subscription ?? null;
  const hasPaddleSubscription = Boolean(
    billingSubscription?.provider === "paddle" &&
      billingSubscription.provider_customer_id &&
      billingSubscription.provider_subscription_id &&
      PAID_ACCESS_STATUSES.has(billingSubscription.status)
  );
  const activeCheckoutPlan = hasPaddleSubscription ? null : pendingCheckoutPlan;
  const shouldShowCheckoutButtons = !hasPaidEntitlement || Boolean(activeCheckoutPlan);

  useEffect(() => {
    if (!pendingCheckoutPlan || !isAuthenticated) {
      return;
    }
    router.replace(pathname, { scroll: false });
  }, [isAuthenticated, pathname, pendingCheckoutPlan, router]);
  const trackerUsagePercent = useMemo(() => {
    if (maxTrackers <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (trackedCount / maxTrackers) * 100));
  }, [maxTrackers, trackedCount]);
  const creditUsagePercent = useMemo(() => {
    if (monthlyCredits <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (consumedCredits / monthlyCredits) * 100));
  }, [consumedCredits, monthlyCredits]);

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("appearance.title")}</CardTitle>
          <CardDescription>{t("appearance.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("light")}
              className={
                activeTheme === "light"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Sun className="size-4" />
              {t("appearance.light")}
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("dark")}
              className={
                activeTheme === "dark"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Moon className="size-4" />
              {t("appearance.dark")}
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("system")}
              className={
                activeTheme === "system"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Laptop className="size-4" />
              {t("appearance.system")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mounted
              ? t("appearance.active", {
                  theme: resolvedTheme === "dark" ? t("appearance.dark") : t("appearance.light"),
                  mode: theme ?? "system",
                })
              : t("appearance.loading")}
          </p>
        </CardContent>
      </Card>

      <TelegramLinkCard
        isAuthenticated={isAuthenticated}
        initialStatus={initialStatus}
        initialError={initialError}
      />

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("adapters.title")}</CardTitle>
          <CardDescription>
            {t("adapters.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportedSitesError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {supportedSitesError}
            </p>
          ) : null}

          {!supportedSitesError && supportedSites.length === 0 ? (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              {t("adapters.empty")}
            </p>
          ) : null}

          {!supportedSitesError && supportedSites.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {supportedSites.map((site, index) => (
                <motion.li
                  key={site.key}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.2, delay: Math.min(index * 0.035, 0.35) }
                  }
                  className="rounded-md border border-border bg-muted/20 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-foreground">{formatSiteKey(site.key)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {site.description || t("adapters.fallbackDescription")}
                  </p>
                </motion.li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("notifications.title")}</CardTitle>
          <CardDescription>{t("notifications.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                <Clock3 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("notifications.dailySummary")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications.dailySummaryDescription")}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={dailySummary}
              onChange={(event) => setDailySummary(event.target.checked)}
              className="size-5 accent-foreground"
            />
          </label>

          <label className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                <VolumeX className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("notifications.muteWeekends")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications.muteWeekendsDescription")}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={muteWeekends}
              onChange={(event) => setMuteWeekends(event.target.checked)}
              className="size-5 accent-foreground"
            />
          </label>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{t("notifications.minDrop")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications.minDropDescription")}</p>
              </div>
            </div>
            <AnimatedDropdown
              value={minimumDrop}
              onValueChange={setMinimumDrop}
              options={minimumDropOptions}
              className="w-28"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("plan.title")}</CardTitle>
          <CardDescription>
            {cycleResetLabel
              ? t("plan.subtitleWithReset", {
                  plan: planKey.toUpperCase(),
                  interval: formatMinimumInterval(minInterval),
                  reset: cycleResetLabel,
                })
              : t("plan.subtitle", {
                  plan: planKey.toUpperCase(),
                  interval: formatMinimumInterval(minInterval),
                })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("plan.trackersUsed")}</span>
            <span className="font-semibold text-foreground">
              {trackedCount} / {maxTrackers}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
              style={{ width: `${trackerUsagePercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{t("plan.monthlyCredits")}</span>
            <span className="font-semibold text-foreground">
              {formatCount(remainingCredits, locale)} / {formatCount(monthlyCredits, locale)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
              style={{ width: `${creditUsagePercent}%` }}
            />
          </div>

          <div className="rounded-md border border-border bg-muted/20 p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("billing.title")}</p>
                <p className="text-xs text-muted-foreground">
                  {hasPaidEntitlement
                    ? t("billing.paidDescription")
                    : t("billing.freeDescription")}
                </p>
                {activeCheckoutPlan ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("billing.openingCheckout", { plan: activeCheckoutPlan.toUpperCase() })}
                  </p>
                ) : null}
              </div>
              {hasPaddleSubscription ? (
                <ManageBillingButton label={t("billing.manage")} />
              ) : shouldShowCheckoutButtons ? (
                <div className="flex flex-wrap gap-2">
                  <PaddleCheckoutButton
                    planKey="plus"
                    className="h-9 rounded-lg border-border bg-background text-foreground hover:bg-muted"
                    idleIcon={<ArrowUpRight className="size-4" />}
                    labels={{
                      syncing: t("billing.syncing"),
                      pending: t("billing.syncPending"),
                      retry: t("billing.refreshPlan"),
                      syncPendingError: t("billing.syncPending"),
                    }}
                    onCompleted={async () => {
                      const refreshed = await refreshViewer({ expectedPlanKey: "plus" });
                      if (refreshed?.entitlement.plan_key !== "plus") {
                        throw new Error(t("billing.syncPending"));
                      }
                    }}
                    autoStart={activeCheckoutPlan === "plus"}
                    onStart={() => setPendingCheckoutPlan(null)}
                  >
                    {t("billing.choosePlus")}
                  </PaddleCheckoutButton>
                  <PaddleCheckoutButton
                    planKey="pro"
                    className="h-9 rounded-lg"
                    idleIcon={<ArrowUpRight className="size-4" />}
                    labels={{
                      syncing: t("billing.syncing"),
                      pending: t("billing.syncPending"),
                      retry: t("billing.refreshPlan"),
                      syncPendingError: t("billing.syncPending"),
                    }}
                    onCompleted={async () => {
                      const refreshed = await refreshViewer({ expectedPlanKey: "pro" });
                      if (refreshed?.entitlement.plan_key !== "pro") {
                        throw new Error(t("billing.syncPending"));
                      }
                    }}
                    autoStart={activeCheckoutPlan === "pro"}
                    onStart={() => setPendingCheckoutPlan(null)}
                  >
                    {t("billing.choosePro")}
                  </PaddleCheckoutButton>
                </div>
              ) : (
                  <p className="max-w-xs text-xs text-muted-foreground">
                    {t("billing.portalPending")}
                  </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
