"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Bell, Clock3, Laptop, Moon, Sun, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TelegramLinkCard } from "@/features/telegram/components/telegram-link-card";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

interface SettingsPageClientProps {
  initialStatus: TelegramActiveStatusResponse | null;
  initialError: string | null;
  trackedCount: number;
}

function formatMinimumInterval(value: number): string {
  if (value < 60) {
    return `${value}s`;
  }
  if (value % 60 === 0) {
    const hours = value / 60;
    return `${hours}h`;
  }
  return `${value}m`;
}

export function SettingsPageClient({
  initialStatus,
  initialError,
  trackedCount,
}: SettingsPageClientProps) {
  const { isAuthenticated, me } = useViewer();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [dailySummary, setDailySummary] = useState(true);
  const [muteWeekends, setMuteWeekends] = useState(false);
  const [minimumDrop, setMinimumDrop] = useState("1");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = Number(me?.entitlement.min_check_interval_minutes) || 1;
  const planKey = me?.entitlement.plan_key ?? "free";
  const usagePercent = useMemo(() => {
    if (maxTrackers <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, (trackedCount / maxTrackers) * 100));
  }, [maxTrackers, trackedCount]);

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
            <select
              value={minimumDrop}
              onChange={(event) => setMinimumDrop(event.target.value)}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              <option value="1">1%</option>
              <option value="3">3%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            {planKey.toUpperCase()} plan · minimum interval {formatMinimumInterval(minInterval)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Trackers used</span>
            <span className="font-semibold text-foreground">
              {trackedCount} / {maxTrackers}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100" style={{ width: `${usagePercent}%` }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
