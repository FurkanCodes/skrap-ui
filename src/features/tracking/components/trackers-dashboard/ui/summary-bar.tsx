"use client";

import { useLocale, useTranslations } from "next-intl";

import { LiveNumberTicker } from "@/components/ui/live-number-ticker";
import { formatCurrencyAmount } from "@/lib/currency";

function formatNumber(value: number, locale: string): string {
  return value.toLocaleString(locale);
}

interface SummaryBarProps {
  active: number;
  alerts: number;
  savedBreakdown: Array<{ currency: string; amount: number }>;
  consumedCredits: number;
  remainingCredits: number;
  monthlyCredits: number;
  trackersUsed: number;
  maxTrackers: number;
  planKey: string;
  resetDateLabel: string | null;
}

function formatSavedLabel(
  savedBreakdown: Array<{ currency: string; amount: number }>,
  moreLabel: (count: number) => string
): string {
  if (savedBreakdown.length === 0) {
    return "—";
  }

  if (savedBreakdown.length === 1) {
    const [entry] = savedBreakdown;
    return formatCurrencyAmount(entry.amount, entry.currency, { fallback: "—" });
  }

  const [first] = savedBreakdown;
  return `${formatCurrencyAmount(first.amount, first.currency, { fallback: "—" })} (${moreLabel(savedBreakdown.length - 1)})`;
}

interface SummaryMetricProps {
  label: string;
  value: string;
  title?: string;
}

function SummaryMetric({ label, value, title }: SummaryMetricProps) {
  return (
    <div className="min-w-[132px]" title={title}>
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

export function SummaryBar({
  active,
  alerts,
  savedBreakdown,
  consumedCredits,
  remainingCredits,
  monthlyCredits,
  trackersUsed,
  maxTrackers,
  planKey,
  resetDateLabel,
}: SummaryBarProps) {
  const t = useTranslations("tracking.dashboard.summary");
  const locale = useLocale();
  const savedLabel = formatSavedLabel(savedBreakdown, (count) => t("moreCurrencies", { count }));
  const activeAlertsLabel = `${formatNumber(active, locale)} / ${formatNumber(alerts, locale)}`;
  const planLabel = t("planLabel", { plan: planKey.toUpperCase() });
  const hasLiveTracking = active > 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-[0_1px_1px_rgb(24_25_37_/_0.03)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground">{t("checksLeft")}</p>
          <p className="flex items-end gap-1 text-[24px] font-semibold leading-none text-foreground">
            {hasLiveTracking ? (
              <LiveNumberTicker
                value={remainingCredits}
                live
                locale={locale}
                className="text-foreground"
              />
            ) : (
              <span className="tabular-nums">{formatNumber(remainingCredits, locale)}</span>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              / {formatNumber(monthlyCredits, locale)}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t("consumedSoFar", { value: formatNumber(consumedCredits, locale) })}
          </p>
        </div>

        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3">
          <SummaryMetric
            label={t("activeAlerts")}
            value={activeAlertsLabel}
            title="Active trackers / alert-mode trackers"
          />
          <SummaryMetric
            label={t("trackersUsed")}
            value={`${formatNumber(trackersUsed, locale)} / ${formatNumber(maxTrackers, locale)}`}
          />
          <SummaryMetric
            label={t("estimatedSavings")}
            value={savedLabel}
            title="Estimated from current price minus target across trackers with valid targets."
          />
        </dl>
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground">
        <span>{planLabel}</span>
        {resetDateLabel ? <span>{t("resets", { date: resetDateLabel })}</span> : null}
      </div>
    </div>
  );
}
