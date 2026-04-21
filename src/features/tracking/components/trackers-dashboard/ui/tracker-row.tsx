"use client";

import { memo } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

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
}: TrackerRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const visibleActionFeedbackState =
    item.status === "active" ? pauseFeedbackState : resumeFeedbackState;
  const visibleActionFeedbackActive = visibleActionFeedbackState !== "idle";
  const busy = isItemActionPending || isDeleteExiting || visibleActionFeedbackActive;
  const progress = getProgress(item);
  const domain = getDomainLabel(item.source_url);
  const productName = item.product_name ?? item.source_url;
  const showDomainBadge = domain.toLowerCase() !== productName.trim().toLowerCase();
  const formattedTargetAmount = formatTargetAmount(item.target_amount, item.currency);
  const formattedCurrentAmount = formatTargetAmount(item.last_amount, item.currency);
  const isTrackingLive = item.status === "active";
  const trackingStatusChipLabel = isTrackingLive ? "Live" : "Paused";
  const trackingStatusLineLabel = isTrackingLive ? "Tracking live" : "Tracking paused";
  const glowTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 170,
        damping: 26,
        mass: 0.85,
      };
  const trackingStatusChipClassName = isTrackingLive
    ? "text-emerald-700 ring-1 ring-emerald-500/35 shadow-[0_0_16px_-10px_rgba(16,185,129,0.9)] transition-shadow dark:text-emerald-300 dark:ring-emerald-400/30 dark:shadow-[0_0_20px_-12px_rgba(16,185,129,0.8)]"
    : undefined;
  const imageFallbackText = productName.slice(0, 1).toUpperCase() || "P";
  const productImageUrl =
    typeof item.image_url === "string" && item.image_url.trim().length > 0
      ? item.image_url
      : null;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.source_url)}`;

  return (
    <article
      className={cn(
        "relative grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_172px]"
      )}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg border border-emerald-500/35 ring-1 ring-emerald-500/20 shadow-[0_0_28px_-18px_rgba(16,185,129,0.7)] dark:border-emerald-400/30 dark:ring-emerald-400/15 dark:shadow-[0_0_32px_-20px_rgba(16,185,129,0.65)]"
        initial={false}
        animate={isTrackingLive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.986 }}
        transition={glowTransition}
      />

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
              alt="Store"
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
            <Chip
              tone={isTrackingLive ? "success" : "muted"}
              className={trackingStatusChipClassName}
            >
              {trackingStatusChipLabel}
            </Chip>
            <Chip tone={item.tracking_mode === "alert" ? "selected" : "subtle"}>
              {item.tracking_mode === "alert" ? "Price Alert" : "Price Drop"}
            </Chip>
          </div>

          <p className="line-clamp-1 text-sm font-semibold text-foreground">{productName}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-2xl font-semibold text-foreground">
              {formatPrice(item.last_amount, item.currency)}
            </span>
            {formattedTargetAmount ? (
              <span className="text-xs text-muted-foreground">Target: {formattedTargetAmount}</span>
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
            {trackingStatusLineLabel} · {getRelativeCheckedLabel(item.updated_at)} · {formatInterval(item.check_interval_minutes)}
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
