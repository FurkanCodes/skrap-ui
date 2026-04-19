"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Waves,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTrackedItemAction,
  deleteTrackedItemAction,
  pauseTrackedItemAction,
  previewTrackedItemAction,
  resumeTrackedItemAction,
} from "@/features/tracking/server/actions";
import type { TrackedItemPreview, TrackedItemSummary } from "@/features/tracking/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

interface TrackersDashboardClientProps {
  isAuthenticated: boolean;
  initialItems: TrackedItemSummary[];
  initialError: string | null;
  telegramConnected: boolean | null;
  telegramBotUsername: string | null;
}

type FilterKey = "all" | "active" | "paused" | "alert" | "monitor";
type TrackingMode = "alert" | "monitor";

interface FilterOption {
  key: FilterKey;
  label: string;
}

const FILTERS: FilterOption[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "alert", label: "Price Alert" },
  { key: "monitor", label: "Monitor" },
];

const INTERVAL_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "15 sec", value: 15 },
  { label: "30 sec", value: 30 },
  { label: "45 sec", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "3 hours", value: 180 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "24 hours", value: 1440 },
];

function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Request failed.";
}

function normalizeBotUsername(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@/, "");
}

function formatInterval(value: number): string {
  if (value < 60) {
    return `every ${value}s`;
  }

  const hours = value / 60;
  if (Number.isInteger(hours) && hours >= 1) {
    return `every ${hours}h`;
  }

  const days = value / 1440;
  if (Number.isInteger(days)) {
    return `every ${days}d`;
  }
  return `every ${value}m`;
}

function parseNumberish(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPrice(value: string | null, currency: string | null): string {
  if (!value) {
    return "Price unavailable";
  }
  if (!currency) {
    return value;
  }
  return `${value} ${currency}`;
}

function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

function getRelativeCheckedLabel(updatedAt: string): string {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return "Checked recently";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "Checked just now";
  }
  if (diffMs < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000));
    return `Checked ${minutes}m ago`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.max(1, Math.floor(diffMs / 3_600_000));
    return `Checked ${hours}h ago`;
  }
  const days = Math.max(1, Math.floor(diffMs / 86_400_000));
  return `Checked ${days}d ago`;
}

function getProgress(item: TrackedItemSummary): { percent: number | null; label: string } {
  const current = parseNumberish(item.last_amount);
  const target = parseNumberish(item.target_amount);

  if (!current || !target || target <= 0) {
    return {
      percent: null,
      label: formatInterval(item.check_interval_minutes),
    };
  }

  const percent = Math.max(0, Math.min(100, (target / current) * 100));
  return {
    percent,
    label: `${Math.round(percent)}% to target`,
  };
}

function getSparklinePoints(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const points: string[] = [];
  for (let index = 0; index < 8; index += 1) {
    const x = index * 14;
    const noise = Math.sin((hash + index * 17) * 0.13);
    const y = 22 + noise * 8;
    points.push(`${x},${Math.max(4, Math.min(36, y)).toFixed(1)}`);
  }

  return points.join(" ");
}

function DotSteps({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={step >= 1 ? "h-1.5 w-6 rounded-full bg-foreground" : "size-1.5 rounded-full bg-border"} />
      <span className={step >= 2 ? "h-1.5 w-6 rounded-full bg-foreground" : "size-1.5 rounded-full bg-border"} />
    </div>
  );
}

export function TrackersDashboardClient({
  isAuthenticated,
  initialItems,
  initialError,
  telegramConnected,
  telegramBotUsername,
}: TrackersDashboardClientProps) {
  const router = useRouter();
  const { me } = useViewer();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshPending, startRefreshTransition] = useTransition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<TrackedItemPreview | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("alert");
  const [targetAmount, setTargetAmount] = useState("");
  const [interval, setInterval] = useState("60");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = Math.max(1, Number(me?.entitlement.min_check_interval_minutes) || 1);
  const displayError = actionError ?? initialError;
  const botUsername = normalizeBotUsername(telegramBotUsername);

  const summary = useMemo(() => {
    const active = initialItems.filter((item) => item.status === "active").length;
    const alerts = initialItems.filter((item) => item.tracking_mode === "alert").length;

    const saved = initialItems.reduce((sum, item) => {
      const current = parseNumberish(item.last_amount);
      const target = parseNumberish(item.target_amount);
      if (!current || !target) {
        return sum;
      }
      return sum + Math.max(current - target, 0);
    }, 0);

    return {
      active,
      alerts,
      saved,
    };
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return initialItems.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        (item.product_name ?? "").toLowerCase().includes(normalizedQuery) ||
        item.source_url.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) {
        return false;
      }

      if (filter === "all") {
        return true;
      }
      if (filter === "active" || filter === "paused") {
        return item.status === filter;
      }
      if (filter === "alert" || filter === "monitor") {
        return item.tracking_mode === filter;
      }
      return true;
    });
  }, [filter, initialItems, query]);

  const resetModal = () => {
    setModalStep(1);
    setUrlInput("");
    setPreview(null);
    setTrackingMode("alert");
    setTargetAmount("");
    setInterval("60");
    setModalError(null);
  };

  const openModal = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const refresh = () => {
    setActionError(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const runItemAction = (itemId: string, action: "pause" | "resume" | "delete") => {
    if (isActionPending || isRefreshPending) {
      return;
    }

    setBusyItemId(itemId);
    setActionError(null);
    setIsActionPending(true);

    void (async () => {
      try {
        if (action === "pause") {
          await pauseTrackedItemAction(itemId);
        } else if (action === "resume") {
          await resumeTrackedItemAction(itemId);
        } else {
          await deleteTrackedItemAction(itemId);
        }
        router.refresh();
      } catch (error) {
        setActionError(mapError(error));
      } finally {
        setBusyItemId(null);
        setIsActionPending(false);
      }
    })();
  };

  const fetchProductPreview = () => {
    setModalError(null);

    startPreviewTransition(async () => {
      try {
        const nextPreview = await previewTrackedItemAction(urlInput);
        setPreview(nextPreview);

        const parsedAmount = parseNumberish(nextPreview.amount);
        if (parsedAmount && parsedAmount > 0) {
          const nextTarget = (parsedAmount * 0.9).toFixed(2);
          setTargetAmount(nextTarget);
        }

        setModalStep(2);
      } catch (error) {
        setModalError(mapError(error));
      }
    });
  };

  const saveTracker = () => {
    if (!preview) {
      setModalError("Fetch product info first.");
      return;
    }

    const parsedInterval = Number(interval);
    if (!Number.isInteger(parsedInterval) || parsedInterval < minInterval || parsedInterval > 10080) {
      setModalError(`Interval must be between ${minInterval} and 10080.`);
      return;
    }

    if (trackingMode === "alert" && !targetAmount.trim()) {
      setModalError("Target price is required in Price Alert mode.");
      return;
    }

    setModalError(null);

    startSaveTransition(async () => {
      try {
        await createTrackedItemAction({
          url: preview.url,
          sites: preview.site_key ? [preview.site_key] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: trackingMode === "alert" ? targetAmount.trim() : null,
        });

        closeModal();
        router.refresh();
      } catch (error) {
        setModalError(mapError(error));
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="border-border/80 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle>Trackers</CardTitle>
          <CardDescription>Sign in to manage trackers and Telegram alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in?next=/" className={buttonVariants({ size: "sm" })}>
            Sign in to continue
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="relative space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Trackers</h1>
          <p className="text-sm text-muted-foreground">Monitor prices and receive Telegram alerts automatically.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={isRefreshPending || isActionPending}>
            {isRefreshPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Refresh
          </Button>
          <Button type="button" size="sm" className="rounded-xl px-4" onClick={openModal}>
            <Plus className="size-3.5" />
            New Tracker
          </Button>
        </div>
      </header>

      {telegramConnected === false ? (
        <Link
          href="/settings"
          className="group block rounded-2xl border border-border/80 bg-card/80 px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-zinc-900 text-white">
                <Bell className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Connect Telegram to receive alerts</p>
                <p className="text-xs text-muted-foreground">
                  Without Telegram, price drop and monitoring notifications cannot be delivered.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
              Set up <ExternalLink className="size-3" />
            </span>
          </div>
        </Link>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="size-4" /> Telegram connected
            {botUsername ? <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">@{botUsername}</span> : null}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="rounded-2xl border-border/80 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <Waves className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <Bell className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Alerts</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.alerts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80 bg-card/95 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200">
              <ShieldAlert className="size-4" />
            </span>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Saved</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">${Math.round(summary.saved)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products..."
            className="h-10 rounded-xl border-border/80 bg-card pl-9"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card p-1 shadow-sm">
          {FILTERS.map((option) => (
            <Button
              key={option.key}
              type="button"
              size="xs"
              variant={filter === option.key ? "default" : "ghost"}
              className="rounded-lg px-3"
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {displayError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{displayError}</p>
      ) : null}

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="rounded-2xl border-border/80 bg-card/95 p-6 text-center text-sm text-muted-foreground shadow-sm">
            No trackers match this view yet.
          </Card>
        ) : (
          filteredItems.map((item) => {
            const busy = isActionPending && busyItemId === item.item_id;
            const progress = getProgress(item);
            const sparklinePoints = getSparklinePoints(item.item_id);
            const domain = getDomainLabel(item.source_url);
            const productName = item.product_name ?? item.source_url;
            const imageFallbackText = productName.slice(0, 1).toUpperCase() || "P";

            return (
              <article
                key={item.item_id}
                className="grid gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/70 bg-zinc-100 text-lg font-semibold text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-300">
                    {item.item_id && item.item_id.length % 2 === 0 ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-50 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950" />
                    ) : null}
                    {item.item_id && item.item_id.length % 2 === 1 ? (
                      <Image
                        src={`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.source_url)}`}
                        alt="Store"
                        fill
                        unoptimized
                        className="object-cover p-5 opacity-70"
                      />
                    ) : null}
                    <span className="relative z-10">{imageFallbackText}</span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="rounded-md bg-zinc-50 text-[11px] text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
                        {domain}
                      </Badge>
                      <Badge variant={item.tracking_mode === "alert" ? "default" : "secondary"} className="rounded-md text-[11px]">
                        {item.tracking_mode === "alert" ? "Price Alert" : "Monitor"}
                      </Badge>
                      {item.status === "paused" ? (
                        <Badge variant="outline" className="rounded-md text-[11px]">
                          Paused
                        </Badge>
                      ) : null}
                    </div>

                    <p className="line-clamp-1 text-[15px] font-semibold text-foreground">{productName}</p>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xl font-bold tracking-tight text-foreground">
                        {formatPrice(item.last_amount, item.currency)}
                      </span>
                      {item.target_amount ? (
                        <span className="text-xs text-muted-foreground">target {item.target_amount}</span>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      {progress.percent !== null ? (
                        <>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{item.last_amount ?? "-"}</span>
                            <span className="font-semibold text-foreground/80">{progress.label}</span>
                            <span>{item.target_amount ?? "-"}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-zinc-900 transition-all duration-500 dark:bg-zinc-100"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">{progress.label}</p>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {getRelativeCheckedLabel(item.updated_at)} · {formatInterval(item.check_interval_minutes)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-3">
                  <svg viewBox="0 0 98 40" className="h-10 w-24 text-zinc-400" role="img" aria-label="Price trend">
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={sparklinePoints}
                    />
                  </svg>

                  <div className="flex items-center gap-1.5">
                    {item.status === "active" ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        disabled={busy || isRefreshPending}
                        onClick={() => runItemAction(item.item_id, "pause")}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Pause className="size-3.5" />}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        disabled={busy || isRefreshPending}
                        onClick={() => runItemAction(item.item_id, "resume")}
                      >
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      disabled={busy || isRefreshPending}
                      onClick={() => runItemAction(item.item_id, "delete")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {initialItems.length} / {maxTrackers} trackers used on {me?.entitlement.plan_key ?? "current"} plan
      </p>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 backdrop-blur-[1px] animate-in fade-in duration-200">
          <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
              <div>
                <p className="text-base font-bold text-foreground">{modalStep === 1 ? "Add New Tracker" : "Configure Tracker"}</p>
                <p className="text-xs text-muted-foreground">
                  {modalStep === 1 ? "Paste a product URL to start." : "Set your alert preferences."}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DotSteps step={modalStep} />
                <Button type="button" size="icon-sm" variant="ghost" onClick={closeModal} disabled={isPreviewPending || isSavePending}>
                  ×
                </Button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {modalStep === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-tracker-url" className="text-xs font-semibold text-foreground">
                      Product URL
                    </Label>
                    <Input
                      id="new-tracker-url"
                      value={urlInput}
                      onChange={(event) => setUrlInput(event.target.value)}
                      placeholder="https://amazon.com/dp/..."
                      className="h-11 rounded-xl border-border/80"
                      disabled={isPreviewPending}
                    />
                  </div>

                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl"
                    disabled={isPreviewPending || !urlInput.trim()}
                    onClick={fetchProductPreview}
                  >
                    {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : null}
                    Fetch Product Info
                  </Button>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Supported stores</p>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {[
                        "Amazon",
                        "Best Buy",
                        "Walmart",
                        "Apple",
                        "Newegg",
                        "B&H",
                        "Target",
                      ].map((store) => (
                        <span key={store} className="rounded-md border border-border/70 bg-background px-2 py-0.5">
                          {store}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {preview ? (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-14 overflow-hidden rounded-lg border border-border/70 bg-zinc-100">
                          {preview.image_url ? (
                            <Image src={preview.image_url} alt={preview.product_name} fill unoptimized className="object-cover" />
                          ) : (
                            <div className="grid h-full place-items-center text-sm font-semibold text-zinc-500">
                              {preview.product_name.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-foreground">{preview.product_name}</p>
                          <p className="text-base font-bold text-foreground">{formatPrice(preview.amount, preview.currency)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Tracking mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTrackingMode("alert")}
                        className={
                          trackingMode === "alert"
                            ? "rounded-xl border-2 border-foreground bg-background p-3 text-left"
                            : "rounded-xl border border-border/80 bg-background p-3 text-left"
                        }
                      >
                        <p className="text-sm font-semibold text-foreground">Price Alert</p>
                        <p className="mt-1 text-xs text-muted-foreground">Notify once target is reached.</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackingMode("monitor")}
                        className={
                          trackingMode === "monitor"
                            ? "rounded-xl border-2 border-foreground bg-background p-3 text-left"
                            : "rounded-xl border border-border/80 bg-background p-3 text-left"
                        }
                      >
                        <p className="text-sm font-semibold text-foreground">Periodic Monitor</p>
                        <p className="mt-1 text-xs text-muted-foreground">Send recurring updates.</p>
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="target-price" className="text-xs font-semibold text-foreground">
                        Target price
                      </Label>
                      <Input
                        id="target-price"
                        value={targetAmount}
                        onChange={(event) => setTargetAmount(event.target.value)}
                        placeholder="84.99"
                        disabled={trackingMode === "monitor" || isSavePending}
                        className="h-10 rounded-xl border-border/80"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="check-every" className="text-xs font-semibold text-foreground">
                        Check every
                      </Label>
                      <select
                        id="check-every"
                        className="h-10 w-full rounded-xl border border-border/80 bg-background px-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
                        value={interval}
                        onChange={(event) => setInterval(event.target.value)}
                        disabled={isSavePending}
                      >
                        {INTERVAL_OPTIONS.filter((option) => option.value >= minInterval).map((option) => (
                          <option key={`${option.label}-${option.value}`} value={String(option.value)}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {telegramConnected === false ? (
                    <div className="rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                      <p className="font-semibold">Telegram not connected</p>
                      <p className="mt-0.5">Alerts will not be delivered until you link Telegram in Settings.</p>
                    </div>
                  ) : null}
                </>
              )}

              {modalError ? (
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{modalError}</p>
              ) : null}
            </div>

            {modalStep === 2 ? (
              <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-5 py-4">
                <Button type="button" variant="ghost" size="sm" onClick={() => setModalStep(1)} disabled={isSavePending}>
                  Back
                </Button>
                <Button type="button" size="sm" className="rounded-xl px-4" onClick={saveTracker} disabled={isSavePending || isPreviewPending}>
                  {isSavePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  Save Tracker
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
