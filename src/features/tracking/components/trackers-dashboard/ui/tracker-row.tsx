"use client";

import { getMessages } from "@/lib/messages";
import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  IconBell,
  IconExternalLink,
  IconPackage,
  IconPackageOff,
  IconTrendingDown,
  IconTrendingUp,
} from "@tabler/icons-react";

import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import {
  formatInterval,
  formatPrice,
  formatTargetAmount,
  getDomainLabel,
  getProgress,
  getRelativeCheckedLabel,
  resolveExternalUrl,
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

const CHIP_ICON_CLASS_NAME = "size-3 shrink-0";

function getUnavailablePriceLabel(
  availability: string,
  t: ReturnType<typeof getMessages>
): string {
  if (availability === "out_of_stock") {
    return t("lastInStock");
  }

  if (availability === "preorder") {
    return t("listedPrice");
  }

  return t("lastKnownPrice");
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
  const t = getMessages("tracking.dashboard.row");
  const locale = "en";
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
  const sourceHref =
    resolveExternalUrl(item.tracked_listing_url, item.source_url) ??
    resolveExternalUrl(item.outbound_url) ??
    resolveExternalUrl(item.source_url) ??
    item.source_url;
  const productName = item.product_name ?? item.source_url;
  const showDomainBadge = domain.toLowerCase() !== productName.trim().toLowerCase();
  const showExtensionBadge = item.created_via === "extension";
  const showAffiliateBadge = item.outbound_is_affiliate;
  const formattedTargetAmount = formatTargetAmount(item.target_amount, item.currency, locale);
  const formattedCurrentAmount = formatTargetAmount(item.last_amount, item.currency, locale);
  const availability = (item.availability ?? "").trim().toLowerCase();
  const isNotInStock =
    availability === "out_of_stock" ||
    availability === "preorder" ||
    availability === "discontinued";
  const availabilityLabel =
    availability === "in_stock"
      ? t("availabilityInStock")
      : availability === "out_of_stock"
        ? t("availabilityOutOfStock")
        : availability === "preorder"
          ? t("availabilityPreorder")
          : availability === "discontinued"
            ? t("availabilityDiscontinued")
            : null;
  const unavailablePriceLabel = isNotInStock
    ? getUnavailablePriceLabel(availability, t)
    : null;
  const isTrackingLive = item.status === "active";
  const trackingStatusChipLabel = isTrackingLive ? t("live") : t("paused");
  const trackingStatusLineLabel = isTrackingLive ? t("trackingLive") : t("trackingPaused");
  const trackingStatusChipClassName = isTrackingLive
    ? "text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300 dark:ring-emerald-400/30"
    : undefined;
  const TrackingModeIcon = item.tracking_mode === "alert" ? IconBell : IconTrendingDown;
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
        "relative grid gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_1px_rgb(24_25_37_/_0.03)] transition-[background-color,border-color,box-shadow] duration-300 md:grid-cols-[minmax(0,1fr)_172px]",
        isNotInStock &&
          "border-amber-300/55 bg-amber-50/35 dark:border-amber-400/25 dark:bg-amber-400/6",
        highlightVisible &&
          "border-primary/55 ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border/70 bg-muted text-lg font-semibold text-muted-foreground",
            isNotInStock &&
              "border-amber-300/45 bg-amber-100/45 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
          )}
        >
          {productImageUrl ? (
            <Image
              src={productImageUrl}
              alt={productName}
              fill
              unoptimized
              className={cn("object-cover", isNotInStock && "grayscale opacity-60")}
            />
          ) : (
            <Image
              src={faviconUrl}
              alt={t("store")}
              fill
              unoptimized
              className={cn("object-cover p-5 opacity-70", isNotInStock && "grayscale")}
            />
          )}
          {!productImageUrl ? <span className="relative z-10">{imageFallbackText}</span> : null}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1">
            {showDomainBadge ? (
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t("openProduct")}
              >
                <Chip tone="muted" className="hover:bg-muted/70 hover:text-foreground">
                  {domain}
                  <IconExternalLink
                    aria-hidden="true"
                    className="size-2.5 shrink-0 opacity-60"
                    stroke={1.8}
                  />
                </Chip>
              </a>
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
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  isTrackingLive
                    ? "bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129_/_0.12)] dark:bg-emerald-300"
                    : "bg-muted-foreground/50"
                )}
              />
              {trackingStatusChipLabel}
            </Chip>
            <Chip tone={item.tracking_mode === "alert" ? "selected" : "subtle"}>
              <TrackingModeIcon
                aria-hidden="true"
                className={CHIP_ICON_CLASS_NAME}
                stroke={1.7}
              />
              {item.tracking_mode === "alert" ? t("priceAlert") : t("priceDrop")}
            </Chip>
            {item.notify_on_price_increase ? (
              <Chip tone="subtle">
                <IconTrendingUp
                  aria-hidden="true"
                  className={CHIP_ICON_CLASS_NAME}
                  stroke={1.7}
                />
                {t("priceIncrease")}
              </Chip>
            ) : null}
            {availabilityLabel && !isNotInStock ? (
              <Chip
                tone="subtle"
                className="text-emerald-700/90 dark:text-emerald-300/90"
              >
                <IconPackage
                  aria-hidden="true"
                  className={CHIP_ICON_CLASS_NAME}
                  stroke={1.7}
                />
                {availabilityLabel}
              </Chip>
            ) : null}
          </div>

          <p className="line-clamp-1 text-sm font-semibold text-foreground">{productName}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {isNotInStock ? (
              <>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-amber-400/14 px-2.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-500/25 dark:bg-amber-400/12 dark:text-amber-200 dark:ring-amber-300/20">
                  <IconPackageOff className="size-3.5" stroke={1.5} />
                  {availabilityLabel}
                </span>
                <span className="text-lg font-semibold tabular-nums text-foreground/75">
                  {formatPrice(item.last_amount, item.currency, locale)}
                </span>
                {unavailablePriceLabel ? (
                  <span className="text-xs text-muted-foreground">
                    {unavailablePriceLabel}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-2xl font-semibold text-foreground">
                {formatPrice(item.last_amount, item.currency, locale)}
              </span>
            )}
            {formattedTargetAmount ? (
              <span className="text-xs text-muted-foreground">
                {t("target", { value: formattedTargetAmount })}
              </span>
            ) : null}
          </div>

          {progress.percent !== null && !isNotInStock ? (
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
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all duration-500"
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
