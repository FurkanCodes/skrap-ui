"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  IconExternalLink,
  IconLoader2,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  deleteTrackedItemAction,
  pauseTrackedItemAction,
  resumeTrackedItemAction,
} from "@/features/tracking/server/actions";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { TEST_INTERVAL_15_SECONDS_VALUE } from "@/features/tracking/components/trackers-dashboard/constants";
import { Link, useRouter } from "@/i18n/navigation";
import { isAppLocale, localizePathname } from "@/i18n/paths";
import { formatCurrencyAmount } from "@/lib/currency";

interface TrackedItemsPanelClientProps {
  isAuthenticated: boolean;
  initialItems: TrackedItemSummary[];
  initialError: string | null;
}

interface ItemOptimisticAction {
  type: "pause" | "resume" | "delete";
  itemId: string;
}

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

function formatAmount(item: TrackedItemSummary, locale: string): string {
  return formatCurrencyAmount(item.last_amount, item.currency, { fallback: "-", locale });
}

function formatIntervalToken(value: number): string {
  if (value === TEST_INTERVAL_15_SECONDS_VALUE) {
    return "15s";
  }
  if (value < 60) {
    return `${value}m`;
  }
  if (value % 1440 === 0) {
    return `${value / 1440}d`;
  }
  if (value % 60 === 0) {
    return `${value / 60}h`;
  }
  return `${value}m`;
}

function applyItemAction(
  current: TrackedItemSummary[],
  action: ItemOptimisticAction
): TrackedItemSummary[] {
  if (action.type === "delete") {
    return current.filter((item) => item.item_id !== action.itemId);
  }

  const nextStatus = action.type === "pause" ? "paused" : "active";
  return current.map((item) =>
    item.item_id === action.itemId ? { ...item, status: nextStatus } : item
  );
}

export function TrackedItemsPanelClient({
  isAuthenticated,
  initialItems,
  initialError,
}: TrackedItemsPanelClientProps) {
  const t = useTranslations("tracking.itemsPanel");
  const locale = useLocale();
  const router = useRouter();
  const [itemsState, setItemsState] = useState<TrackedItemSummary[]>(initialItems);
  const [items, applyOptimisticItemAction] = useOptimistic<
    TrackedItemSummary[],
    ItemOptimisticAction
  >(itemsState, applyItemAction);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isActionTransitionPending, startActionTransition] = useTransition();
  const displayError = actionError ?? initialError;
  const isMutating = isActionPending || isRefreshPending || isActionTransitionPending;
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.status === "active").length;
    return { total: items.length, active };
  }, [items]);

  const refresh = () => {
    setActionError(null);
    setBusyItemId(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const runItemAction = (itemId: string, action: "pause" | "resume" | "delete") => {
    if (isMutating) {
      return;
    }
    setBusyItemId(itemId);
    setActionError(null);
    setIsActionPending(true);
    const itemAction: ItemOptimisticAction = { type: action, itemId };

    startActionTransition(async () => {
      applyOptimisticItemAction(itemAction);
      try {
        if (action === "pause") {
          await pauseTrackedItemAction(itemId);
        } else if (action === "resume") {
          await resumeTrackedItemAction(itemId);
        } else {
          await deleteTrackedItemAction(itemId);
        }

        setItemsState((current) => applyItemAction(current, itemAction));
      } catch (actionError) {
        setActionError(mapError(actionError, t("errors.requestFailed")));
        startRefreshTransition(() => {
          router.refresh();
        });
      } finally {
        setBusyItemId(null);
        setIsActionPending(false);
      }
    });
  };

  if (!isAuthenticated) {
    const nextPath = localizePathname("/dashboard", isAppLocale(locale) ? locale : "en");
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("auth.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}
            className={buttonVariants({ size: "sm" })}
          >
            {t("auth.cta")}
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("summary", {
              total: numberFormatter.format(summary.total),
              active: numberFormatter.format(summary.active),
            })}
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={isMutating}
        >
          {isRefreshPending ? (
              <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
          ) : (
              <IconRefresh className="size-3.5" stroke={1.5} />
          )}
          {t("actions.refresh")}
        </Button>
      </CardHeader>

      <CardContent className="grid gap-2">
        {displayError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {displayError}
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          items.map((item) => {
            const busy = isActionPending && busyItemId === item.item_id;
            return (
              <div
                key={item.item_id}
                className="grid gap-2 rounded-md border bg-muted/10 px-3 py-2 md:grid-cols-[1fr_auto]"
              >
                <div className="space-y-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.product_name ?? item.source_url}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{item.source_url}</p>
                  <div className="flex flex-wrap gap-1">
                    <Chip tone={item.status === "active" ? "success" : "muted"}>
                      {item.status === "active" ? t("status.active") : t("status.paused")}
                    </Chip>
                    <Chip tone="muted">
                      {item.tracking_mode === "alert" ? t("mode.alert") : t("mode.monitor")}
                    </Chip>
                    {item.notify_on_price_increase ? (
                      <Chip tone="muted">{t("chips.priceIncrease")}</Chip>
                    ) : null}
                    <Chip tone="muted">
                      {t("chips.every", {
                        value: formatIntervalToken(item.check_interval_minutes),
                      })}
                    </Chip>
                    <Chip tone="muted">{formatAmount(item, locale)}</Chip>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1 md:justify-end">
                  <a
                    href={item.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ size: "xs", variant: "outline" })}
                  >
                      <IconExternalLink className="size-3.5" stroke={1.5} />
                    {t("actions.openLink")}
                  </a>
                  {item.status === "active" ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => runItemAction(item.item_id, "pause")}
                      disabled={busy || isMutating}
                    >
                      {busy ? (
                          <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
                        ) : (
                          <IconPlayerPause className="size-3.5" stroke={1.5} />
                      )}
                      {t("actions.pause")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => runItemAction(item.item_id, "resume")}
                      disabled={busy || isMutating}
                    >
                      {busy ? (
                          <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
                        ) : (
                          <IconPlayerPlay className="size-3.5" stroke={1.5} />
                      )}
                      {t("actions.resume")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    onClick={() => runItemAction(item.item_id, "delete")}
                    disabled={busy || isMutating}
                  >
                        <IconTrash className="size-3.5" stroke={1.5} />
                    {t("actions.delete")}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
