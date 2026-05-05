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
    <div className="min-w-0 space-y-1" title={title}>
      <dt className="text-[11px] font-medium leading-none text-muted-foreground">{label}</dt>
      <dd className="text-[15px] font-semibold leading-none text-foreground">{value}</dd>
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
  const creditProgress =
    monthlyCredits > 0 ? Math.min(100, Math.max(0, (consumedCredits / monthlyCredits) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_1px_rgb(24_25_37_/_0.03)] sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-end">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t("checksLeft")}</p>
              <p className="flex items-end gap-1.5 text-[28px] font-semibold leading-none text-foreground">
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
                <span className="pb-0.5 text-sm font-medium text-muted-foreground">
                  / {formatNumber(monthlyCredits, locale)}
                </span>
              </p>
            </div>
            <p className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {t("consumedSoFar", { value: formatNumber(consumedCredits, locale) })}
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-[width] duration-200 ease-out"
              style={{ width: `${creditProgress}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-3">
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

      <div className="mt-4 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
        <span>{planLabel}</span>
        {resetDateLabel ? <span>{t("resets", { date: resetDateLabel })}</span> : null}
      </div>
    </div>
  );
}
