"use client";

import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import {
  formatInterval,
  formatPrice,
  formatTargetAmount,
  getDomainLabel,
  getProgress,
  getRelativeCheckedLabel,
} from "@/features/tracking/components/trackers-dashboard/utils";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { Chip } from "@/components/ui/chip";
import { TrackerActionButtons } from "@/features/tracking/components/trackers-dashboard/ui/tracker-action-buttons";
import { cn } from "@/lib/utils";

interface TrackerRowProps {
  item: TrackedItemSummary;
  isRefreshPending: boolean;
  isItemActionPending: boolean;
  isDeleteExiting: boolean;
  isDeleteConfirmOpen: boolean;
  isDeletePending: boolean;
  pauseFeedbackState: ActionFeedbackState;
  rowActionError: string | null;
  resumeFeedbackState: ActionFeedbackState;
  cancelDeleteAction: () => void;
  confirmDeleteAction: () => void;
  dismissRowActionError: (itemId: string) => void;
  openEditModal: (itemId: string) => void;
  runItemAction: (itemId: string, action: ItemAction) => void;
  requestDeleteAction: (itemId: string) => void;
  isHighlighted: boolean;
}

export const TrackerRow = memo(function TrackerRow({
  item,
  isRefreshPending,
  isItemActionPending,
  isDeleteExiting,
  isDeleteConfirmOpen,
  isDeletePending,
  pauseFeedbackState,
  rowActionError,
  resumeFeedbackState,
  cancelDeleteAction,
  confirmDeleteAction,
  dismissRowActionError,
  openEditModal,
  runItemAction,
  requestDeleteAction,
  isHighlighted,
}: TrackerRowProps) {
  const t = useTranslations("tracking.dashboard.row");
  const locale = useLocale();
  const rowRef = useRef<HTMLElement | null>(null);
  const [highlightVisible, setHighlightVisible] = useState(false);
  const visibleActionFeedbackState =
    item.status === "active" ? pauseFeedbackState : resumeFeedbackState;
  const visibleActionFeedbackActive = visibleActionFeedbackState !== "idle";
  const busy = isItemActionPending || isDeleteExiting || visibleActionFeedbackActive;
  const intervalLabel = formatInterval(item.check_interval_minutes, {
    everyPrefix: t("every"),
  });
  const checkedLabel = getRelativeCheckedLabel(item.updated_at, {
    checkedRecently: t("checkedRecently"),
    checkedJustNow: t("checkedJustNow"),
    checkedMinutesAgo: (minutes) => t("checkedMinutesAgo", { minutes }),
    checkedHoursAgo: (hours) => t("checkedHoursAgo", { hours }),
    checkedDaysAgo: (days) => t("checkedDaysAgo", { days }),
  });
  const progress = getProgress(item, {
    locale,
    atTarget: t("atTarget"),
    belowTarget: (value) => t("belowTarget", { value }),
    belowTargetCompact: t("belowTargetCompact"),
    aboveTarget: (value) => t("aboveTarget", { value }),
    aboveTargetCompact: t("aboveTargetCompact"),
  });
  const domain = getDomainLabel(item.source_url);
  const productName = item.product_name ?? item.source_url;
  const showDomainBadge = domain.toLowerCase() !== productName.trim().toLowerCase();
  const showExtensionBadge = item.created_via === "extension";
  const showAffiliateBadge = item.outbound_is_affiliate;
  const formattedTargetAmount = formatTargetAmount(item.target_amount, item.currency, locale);
  const formattedCurrentAmount = formatTargetAmount(item.last_amount, item.currency, locale);
  const isTrackingLive = item.status === "active";
  const trackingStatusChipLabel = isTrackingLive ? t("live") : t("paused");
  const trackingStatusLineLabel = isTrackingLive ? t("trackingLive") : t("trackingPaused");
  const trackingStatusChipClassName = isTrackingLive
    ? "text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-400/30"
    : undefined;
  const imageFallbackText = productName.slice(0, 1).toUpperCase() || "P";
  const productImageUrl =
    typeof item.image_url === "string" && item.image_url.trim().length > 0
      ? item.image_url
      : null;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.source_url)}`;

  useEffect(() => {
    if (!isHighlighted) {
      return;
    }

    rowRef.current?.scrollIntoView({ block: "center" });
    setHighlightVisible(true);
    const timer = setTimeout(() => setHighlightVisible(false), 3200);
    return () => clearTimeout(timer);
  }, [isHighlighted]);

  return (
    <article
      ref={rowRef}
      className={cn(
        "relative grid gap-3 rounded-lg border border-border/80 bg-card p-4 shadow-[0_1px_0_0_hsl(var(--border)/0.4)] transition-[border-color,box-shadow] duration-300 md:grid-cols-[minmax(0,1fr)_172px]",
        highlightVisible &&
          "border-primary/55 ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex gap-3">
        <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-zinc-100 text-lg font-semibold text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-300">
          {productImageUrl ? (
            <Image
              src={productImageUrl}
              alt={productName}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <Image
              src={faviconUrl}
              alt={t("store")}
              fill
              unoptimized
              className="object-cover p-5 opacity-70"
            />
          )}
          {!productImageUrl ? <span className="relative z-10">{imageFallbackText}</span> : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {showDomainBadge ? (
              <Chip tone="muted">
                {domain}
              </Chip>
            ) : null}
            {showExtensionBadge ? (
              <Chip tone="muted">
                {t("extension")}
              </Chip>
            ) : null}
            {showAffiliateBadge ? (
              <Chip tone="muted">
                {t("affiliateLink")}
              </Chip>
            ) : null}
            <Chip
              tone={isTrackingLive ? "success" : "muted"}
              className={trackingStatusChipClassName}
            >
              {trackingStatusChipLabel}
            </Chip>
            <Chip tone={item.tracking_mode === "alert" ? "selected" : "subtle"}>
              {item.tracking_mode === "alert" ? t("priceAlert") : t("priceDrop")}
            </Chip>
            {item.notify_on_price_increase ? (
              <Chip tone="subtle">
                {t("priceIncrease")}
              </Chip>
            ) : null}
          </div>

          <p className="line-clamp-1 text-sm font-semibold text-foreground">{productName}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(item.last_amount, item.currency, locale)}
            </span>
            {formattedTargetAmount ? (
              <span className="text-xs text-muted-foreground">
                {t("target", { value: formattedTargetAmount })}
              </span>
            ) : null}
          </div>

          {progress.percent !== null ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="min-w-0 max-w-[34%] truncate">{formattedCurrentAmount ?? "-"}</span>
                <span className="shrink-0 font-semibold text-foreground/80 sm:hidden">
                  {progress.compactLabel}
                </span>
                <span className="hidden shrink-0 font-semibold text-foreground/80 sm:inline">
                  {progress.label}
                </span>
                <span className="min-w-0 max-w-[34%] truncate text-right">
                  {formattedTargetAmount ?? "-"}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-sm bg-zinc-900 transition-all duration-500 dark:bg-zinc-100"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground">
            {trackingStatusLineLabel} · {checkedLabel} · {intervalLabel}
          </p>
        </div>
      </div>

      <TrackerActionButtons
        item={item}
        busy={busy}
        isDeleteConfirmOpen={isDeleteConfirmOpen}
        isRefreshPending={isRefreshPending}
        pauseFeedbackState={pauseFeedbackState}
        resumeFeedbackState={resumeFeedbackState}
        rowActionError={rowActionError}
        cancelDeleteAction={cancelDeleteAction}
        confirmDeleteAction={confirmDeleteAction}
        dismissRowActionError={dismissRowActionError}
        openEditModal={openEditModal}
        isDeletePending={isDeletePending}
        runItemAction={runItemAction}
        requestDeleteAction={requestDeleteAction}
      />
    </article>
  );
});
