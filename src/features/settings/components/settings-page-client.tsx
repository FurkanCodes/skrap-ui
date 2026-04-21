"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Bell, Clock3, Laptop, Moon, Sun, VolumeX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";

import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function formatPeriodEnd(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
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
}: SettingsPageClientProps) {
  const { isAuthenticated, me } = useViewer();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [dailySummary, setDailySummary] = useState(true);
  const [muteWeekends, setMuteWeekends] = useState(false);
  const [minimumDrop, setMinimumDrop] = useState("1");
  const minimumDropOptions = [
    { value: "1", label: "1%" },
    { value: "3", label: "3%" },
    { value: "5", label: "5%" },
    { value: "10", label: "10%" },
  ];
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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
  const cycleResetLabel = formatPeriodEnd(me?.usage?.period_end ?? null);
  const planKey = me?.entitlement.plan_key ?? "free";
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
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage integrations and notifications.</p>
      </header>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose how the interface looks across the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("light")}
              className={
                theme === "light"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Sun className="size-4" />
              Light
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("dark")}
              className={
                theme === "dark"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Moon className="size-4" />
              Dark
            </button>
            <button
              type="button"
              disabled={!mounted}
              onClick={() => setTheme("system")}
              className={
                theme === "system"
                  ? "flex items-center justify-center gap-2 rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm font-medium text-foreground"
                  : "flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
              }
            >
              <Laptop className="size-4" />
              System
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {mounted
              ? `Active: ${resolvedTheme === "dark" ? "Dark" : "Light"} (${theme ?? "system"} mode)`
              : "Loading theme preference..."}
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
          <CardTitle>Store Adapters</CardTitle>
          <CardDescription>
            Pulled from backend capabilities. Any URL can still use generic extraction.
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
              No adapter metadata returned yet.
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
                    {site.description || "Backend adapter available for this store."}
                  </p>
                </motion.li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Configure global alert behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-md border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
                <Clock3 className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Daily price summary</p>
                <p className="text-xs text-muted-foreground">Receive a digest of all tracked prices at 9:00 AM.</p>
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
                <p className="text-sm font-semibold text-foreground">Mute on weekends</p>
                <p className="text-xs text-muted-foreground">Pause notifications on Saturday and Sunday.</p>
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
                <p className="text-sm font-semibold text-foreground">Minimum drop to alert</p>
                <p className="text-xs text-muted-foreground">Only notify when price drops at least this much.</p>
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
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            {planKey.toUpperCase()} plan · minimum interval {formatMinimumInterval(minInterval)}
            {cycleResetLabel ? ` · credits reset ${cycleResetLabel}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Trackers used</span>
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
            <span>Monthly credits</span>
            <span className="font-semibold text-foreground">
              {remainingCredits.toLocaleString()} / {monthlyCredits.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
              style={{ width: `${creditUsagePercent}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
