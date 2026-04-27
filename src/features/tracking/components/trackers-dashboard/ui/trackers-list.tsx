"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrackerRow } from "@/features/tracking/components/trackers-dashboard/ui/tracker-row";
import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import type { TrackedItemSummary } from "@/features/tracking/types";

const LIST_EASE = [0.22, 1, 0.36, 1] as const;

interface TrackersListProps {
  filteredItems: TrackedItemSummary[];
  isRefreshPending: boolean;
  deleteConfirmItemId: string | null;
  rowActionErrorByItemId: Record<string, string>;
  dismissRowActionError: (itemId: string) => void;
  exitingDeleteItemIds: Set<string>;
  pendingActionItemIds: Set<string>;
  pendingDeleteItemIds: Set<string>;
  pauseFeedbackByItemId: Record<string, ActionFeedbackState>;
  resumeFeedbackByItemId: Record<string, ActionFeedbackState>;
  cancelDeleteAction: () => void;
  confirmDeleteAction: () => void;
  openEditModal: (itemId: string) => void;
  runItemAction: (itemId: string, action: ItemAction) => void;
  requestDeleteAction: (itemId: string) => void;
  hasAnyItems: boolean;
  hasActiveFilters: boolean;
  canCreateTracker: boolean;
  createTrackerDisabledReason: string | null;
  onClearFilters: () => void;
  onOpenModal: () => void;
}

export function TrackersList({
  filteredItems,
  isRefreshPending,
  deleteConfirmItemId,
  rowActionErrorByItemId,
  dismissRowActionError,
  exitingDeleteItemIds,
  pendingActionItemIds,
  pendingDeleteItemIds,
  pauseFeedbackByItemId,
  resumeFeedbackByItemId,
  cancelDeleteAction,
  confirmDeleteAction,
  openEditModal,
  runItemAction,
  requestDeleteAction,
  hasAnyItems,
  hasActiveFilters,
  canCreateTracker,
  createTrackerDisabledReason,
  onClearFilters,
  onOpenModal,
}: TrackersListProps) {
  const t = useTranslations("tracking.dashboard.list");
  const shouldReduceMotion = useReducedMotion();
  const rowTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.26, ease: LIST_EASE };

  if (filteredItems.length === 0) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="trackers-empty"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={rowTransition}
          className="space-y-3"
        >
          <Card className="rounded-lg border-border bg-card p-6 text-center text-sm text-muted-foreground">
            <div className="space-y-3">
              <p>
                {hasAnyItems
                  ? t("noFilteredItems")
                  : t("noItems")}
              </p>
              {hasAnyItems && hasActiveFilters ? (
                <Button type="button" size="sm" variant="outline" onClick={onClearFilters}>
                  {t("clearFilters")}
                </Button>
              ) : null}
              {!hasAnyItems ? (
                createTrackerDisabledReason ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <span className="inline-flex">
                          <Button
                            type="button"
                            size="sm"
                            onClick={onOpenModal}
                            disabled={!canCreateTracker}
                          >
                            {t("newTracker")}
                          </Button>
                        </span>
                      }
                    />
                    <TooltipContent>{createTrackerDisabledReason}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={onOpenModal}
                    disabled={!canCreateTracker}
                  >
                    {t("newTracker")}
                  </Button>
                )
              ) : null}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <motion.div layout className="space-y-3">
      <AnimatePresence initial={false} mode="popLayout">
        {filteredItems.map((item) => (
          <motion.div
            key={item.item_id}
            layout="position"
            animate={
              exitingDeleteItemIds.has(item.item_id)
                ? { opacity: 0, scale: 0.975, x: 20, y: -4 }
                : { opacity: 1, scale: 1, x: 0, y: 0 }
            }
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 14, scale: 0.985 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12, scale: 0.97 }
            }
            transition={rowTransition}
            className="will-change-transform"
          >
            <TrackerRow
              item={item}
              isRefreshPending={isRefreshPending}
              isItemActionPending={pendingActionItemIds.has(item.item_id)}
              isDeleteExiting={exitingDeleteItemIds.has(item.item_id)}
              isDeleteConfirmOpen={deleteConfirmItemId === item.item_id}
              isDeletePending={pendingDeleteItemIds.has(item.item_id)}
              pauseFeedbackState={pauseFeedbackByItemId[item.item_id] ?? "idle"}
              rowActionError={rowActionErrorByItemId[item.item_id] ?? null}
              resumeFeedbackState={resumeFeedbackByItemId[item.item_id] ?? "idle"}
              cancelDeleteAction={cancelDeleteAction}
              confirmDeleteAction={confirmDeleteAction}
              dismissRowActionError={dismissRowActionError}
              openEditModal={openEditModal}
              runItemAction={runItemAction}
              requestDeleteAction={requestDeleteAction}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
