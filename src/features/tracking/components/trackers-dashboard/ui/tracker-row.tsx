"use client";

import { memo } from "react";
import Image from "next/image";

import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import { formatInterval, formatPrice, getDomainLabel, getProgress, getRelativeCheckedLabel } from "@/features/tracking/components/trackers-dashboard/utils";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { Badge } from "@/components/ui/badge";
import { TrackerActionButtons } from "@/features/tracking/components/trackers-dashboard/ui/tracker-action-buttons";

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
  const visibleActionFeedbackState =
    item.status === "active" ? pauseFeedbackState : resumeFeedbackState;
  const visibleActionFeedbackActive = visibleActionFeedbackState !== "idle";
  const busy = isItemActionPending || isDeleteExiting || visibleActionFeedbackActive;
  const progress = getProgress(item);
  const domain = getDomainLabel(item.source_url);
  const productName = item.product_name ?? item.source_url;
  const imageFallbackText = productName.slice(0, 1).toUpperCase() || "P";
  const productImageUrl =
    typeof item.image_url === "string" && item.image_url.trim().length > 0
      ? item.image_url
      : null;
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.source_url)}`;

  return (
    <article
      className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_172px]"
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
            <Badge
              variant="outline"
              className="rounded-sm bg-zinc-50 text-[11px] text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300"
            >
              {domain}
            </Badge>
            <Badge
              variant={item.tracking_mode === "alert" ? "default" : "secondary"}
              className="rounded-sm text-[11px]"
            >
              {item.tracking_mode === "alert" ? "Price Alert" : "Monitor"}
            </Badge>
            {item.status === "paused" ? (
              <Badge variant="outline" className="rounded-sm text-[11px]">
                Paused
              </Badge>
            ) : null}
          </div>

          <p className="line-clamp-1 text-sm font-semibold text-foreground">{productName}</p>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-2xl font-semibold text-foreground">
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
                <div className="h-1.5 overflow-hidden rounded-sm bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-sm bg-zinc-900 transition-all duration-500 dark:bg-zinc-100"
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
