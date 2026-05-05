"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconArrowUpRight,
  IconChevronDown,
  IconDeviceLaptop,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useTheme } from "@/components/theme/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageBillingButton } from "@/features/billing/components/manage-billing-button";
import { Radio } from "@/components/ui/radio";
import type { BillingCurrentResponse, BillingPlanKey } from "@/features/billing/types";
import type { SiteInfoResponse } from "@/features/scraper/types";
import { resolveEffectiveMinIntervalMinutes } from "@/features/tracking/interval-policy";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { cn } from "@/lib/utils";

interface SettingsPageClientProps {
  trackedCount: number;
  supportedSites: SiteInfoResponse[];
  supportedSitesError: string | null;
  initialBilling: BillingCurrentResponse | null;
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
    return `${value / 60}h`;
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
  trackedCount,
  supportedSites,
  supportedSitesError,
  initialBilling,
}: SettingsPageClientProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const locale = useLocale();
  const { me } = useViewer();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [adaptersOpen, setAdaptersOpen] = useState(false);
  const currentLocale = isAppLocale(locale) ? locale : "en";
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
  const needsBillingSync = hasPaidEntitlement && !hasPaddleSubscription;

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

  function openBillingCheckout(plan: BillingPlanKey): void {
    const path = localizePathname("/billing/checkout", currentLocale);
    router.push(`${path}?plan=${plan}`);
  }

  function openBillingStatus(): void {
    const path = localizePathname("/billing/return", currentLocale);
    router.push(path);
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-lg border-border bg-card">
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
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
          </div>
          {hasPaddleSubscription ? (
            <ManageBillingButton label={t("billing.manage")} />
          ) : needsBillingSync ? (
            <button
              type="button"
              onClick={openBillingStatus}
              className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              {t("billing.refreshPlan")}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => openBillingCheckout("plus")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
              >
                <IconArrowUpRight className="size-4" stroke={1.5} />
                {t("billing.choosePlus")}
              </button>
              <button
                type="button"
                onClick={() => openBillingCheckout("pro")}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
              >
                <IconArrowUpRight className="size-4" stroke={1.5} />
                {t("billing.choosePro")}
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <UsageMeter
            label={t("plan.trackersUsed")}
            value={`${trackedCount} / ${maxTrackers}`}
            percent={trackerUsagePercent}
          />
          <UsageMeter
            label={t("plan.monthlyCredits")}
            value={`${formatCount(remainingCredits, locale)} / ${formatCount(monthlyCredits, locale)}`}
            percent={creditUsagePercent}
          />
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            {hasPaidEntitlement ? t("billing.paidDescription") : t("billing.freeDescription")}
            {needsBillingSync ? ` ${t("billing.syncPending")}` : ""}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>{t("appearance.title")}</CardTitle>
          <CardDescription>{t("appearance.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <ThemeButton
              active={activeTheme === "light"}
              disabled={!mounted}
              icon={<IconSun className="size-4" stroke={1.5} />}
              label={t("appearance.light")}
              onClick={() => setTheme("light")}
            />
            <ThemeButton
              active={activeTheme === "dark"}
              disabled={!mounted}
              icon={<IconMoon className="size-4" stroke={1.5} />}
              label={t("appearance.dark")}
              onClick={() => setTheme("dark")}
            />
            <ThemeButton
              active={activeTheme === "system"}
              disabled={!mounted}
              icon={<IconDeviceLaptop className="size-4" stroke={1.5} />}
              label={t("appearance.system")}
              onClick={() => setTheme("system")}
            />
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

      <Card className="rounded-lg border-border bg-card">
        <button
          type="button"
          onClick={() => setAdaptersOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          aria-expanded={adaptersOpen}
        >
          <span>
            <span className="block text-sm font-semibold text-foreground">{t("adapters.title")}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {supportedSitesError
                ? supportedSitesError
                : t("adapters.summary", { count: supportedSites.length })}
            </span>
          </span>
          <IconChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", adaptersOpen ? "rotate-180" : "")}
            stroke={1.5}
          />
        </button>

        <AnimatePresence initial={false}>
          {adaptersOpen ? (
            <motion.div
              initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-3 border-t border-border/70 pt-3">
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
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function UsageMeter({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function ThemeButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/45"
    >
      <Radio checked={active} readOnly aria-hidden="true" tabIndex={-1} />
      {icon}
      {label}
    </button>
  );
}
