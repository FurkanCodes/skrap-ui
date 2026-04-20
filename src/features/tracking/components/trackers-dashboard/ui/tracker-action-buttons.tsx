"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";

import { PauseActionIcon, ResumeActionIcon } from "@/features/tracking/components/trackers-dashboard/action-icons";
import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrackerActionButtonsProps {
  item: TrackedItemSummary;
  busy: boolean;
  isDeleteConfirmOpen: boolean;
  isRefreshPending: boolean;
  pauseFeedbackState: ActionFeedbackState;
  resumeFeedbackState: ActionFeedbackState;
  rowActionError: string | null;
  cancelDeleteAction: () => void;
  confirmDeleteAction: () => void;
  dismissRowActionError: (itemId: string) => void;
  openEditModal: (itemId: string) => void;
  isDeletePending: boolean;
  runItemAction: (itemId: string, action: ItemAction) => void;
  requestDeleteAction: (itemId: string) => void;
}

export function TrackerActionButtons({
  item,
  busy,
  isDeleteConfirmOpen,
  isRefreshPending,
  pauseFeedbackState,
  resumeFeedbackState,
  rowActionError,
  cancelDeleteAction,
  confirmDeleteAction,
  dismissRowActionError,
  openEditModal,
  isDeletePending,
  runItemAction,
  requestDeleteAction,
}: TrackerActionButtonsProps) {
  const controlsDisabled = busy || isRefreshPending;
  const shouldReduceMotion = useReducedMotion();
  const smoothEase = [0.22, 1, 0.36, 1] as const;
  const quickTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: smoothEase };
  const confirmTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: smoothEase };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-1.5 md:w-full">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={controlsDisabled}
          aria-label="Edit tracker"
          onClick={() => openEditModal(item.item_id)}
        >
          <Pencil className="size-3.5" />
        </Button>

        <AnimatePresence mode="wait" initial={false}>
          {item.status === "active" ? (
            <motion.div
              key={`${item.item_id}-pause`}
              className="order-2"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={quickTransition}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={controlsDisabled}
                aria-busy={pauseFeedbackState === "loading" ? true : undefined}
                aria-label={
                  pauseFeedbackState === "loading"
                    ? "Pausing tracker"
                    : pauseFeedbackState === "success"
                      ? "Tracker paused successfully"
                      : pauseFeedbackState === "error"
                        ? "Failed to pause tracker"
                        : "Pause tracker"
                }
                className={cn(
                  "relative overflow-hidden transition-[background-color,border-color,color,transform] duration-300",
                  pauseFeedbackState === "loading" && "bg-muted text-foreground",
                  pauseFeedbackState === "success" &&
                    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-500",
                  pauseFeedbackState === "error" &&
                    "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive dark:border-destructive dark:bg-destructive dark:hover:bg-destructive"
                )}
                onClick={() => runItemAction(item.item_id, "pause")}
              >
                <PauseActionIcon state={pauseFeedbackState} />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={`${item.item_id}-resume`}
              className="order-2"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={quickTransition}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={controlsDisabled}
                aria-busy={resumeFeedbackState === "loading" ? true : undefined}
                aria-label={
                  resumeFeedbackState === "loading"
                    ? "Resuming tracker"
                    : resumeFeedbackState === "success"
                      ? "Tracker resumed successfully"
                      : resumeFeedbackState === "error"
                        ? "Failed to resume tracker"
                        : "Resume tracker"
                }
                className={cn(
                  "relative overflow-hidden transition-[background-color,border-color,color,transform] duration-300",
                  resumeFeedbackState === "loading" && "bg-muted text-foreground",
                  resumeFeedbackState === "success" &&
                    "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-500",
                  resumeFeedbackState === "error" &&
                    "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive dark:border-destructive dark:bg-destructive dark:hover:bg-destructive"
                )}
                onClick={() => runItemAction(item.item_id, "resume")}
              >
                <ResumeActionIcon state={resumeFeedbackState} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="popLayout" initial={false}>
          {isDeleteConfirmOpen ? (
            <motion.div
              key={`${item.item_id}-delete-confirm`}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scaleX: 0.64, scaleY: 0.94, x: 6 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scaleX: 1, scaleY: 1, x: 0 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scaleX: 0.64, scaleY: 0.94, x: 6 }
              }
              transition={confirmTransition}
              className="order-1 origin-center"
            >
              <div className="inline-flex h-7 overflow-hidden rounded-[min(var(--radius-md),12px)] border border-border bg-background shadow-sm">
                <button
                  type="button"
                  disabled={controlsDisabled}
                  aria-busy={isDeletePending ? true : undefined}
                  onClick={confirmDeleteAction}
                  className="inline-flex min-w-[52px] items-center justify-center gap-1.5 border-r border-border bg-destructive/10 px-3 text-[11px] font-semibold text-destructive transition hover:bg-destructive/20 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isDeletePending ? <Loader2 className="size-3 animate-spin" /> : null}
                  OK
                </button>
                <button
                  type="button"
                  disabled={controlsDisabled || isDeletePending}
                  onClick={cancelDeleteAction}
                  className="inline-flex min-w-[70px] items-center justify-center px-3 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`${item.item_id}-delete`}
              className="order-1"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: 4 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, x: 4 }}
              transition={quickTransition}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                disabled={controlsDisabled}
                aria-busy={isDeletePending ? true : undefined}
                onClick={() => requestDeleteAction(item.item_id)}
              >
                {isDeletePending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {rowActionError ? (
        <div className="flex max-w-[260px] items-start justify-end gap-1 text-[11px] text-destructive md:ml-auto md:text-right">
          <span className="line-clamp-2">{rowActionError}</span>
          <button
            type="button"
            className="mt-0.5 shrink-0 rounded-sm text-destructive/80 transition hover:text-destructive"
            onClick={() => dismissRowActionError(item.item_id)}
            aria-label="Dismiss action error"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
