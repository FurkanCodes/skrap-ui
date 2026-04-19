"use client";

import { AnimatePresence, motion } from "motion/react";
import { Loader2, Trash2 } from "lucide-react";

import { PauseActionIcon, ResumeActionIcon } from "@/features/tracking/components/trackers-dashboard/action-icons";
import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrackerActionButtonsProps {
  item: TrackedItemSummary;
  busy: boolean;
  isMutating: boolean;
  pauseFeedbackState: ActionFeedbackState;
  resumeFeedbackState: ActionFeedbackState;
  isDeletePending: boolean;
  runItemAction: (itemId: string, action: ItemAction) => void;
  requestDeleteAction: (itemId: string) => void;
}

export function TrackerActionButtons({
  item,
  busy,
  isMutating,
  pauseFeedbackState,
  resumeFeedbackState,
  isDeletePending,
  runItemAction,
  requestDeleteAction,
}: TrackerActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-1.5 md:flex-col md:items-end md:justify-center">
      <AnimatePresence mode="wait" initial={false}>
        {item.status === "active" ? (
          <motion.div
            key={`${item.item_id}-pause`}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={busy || isMutating}
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
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled={busy || isMutating}
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

      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={busy || isMutating}
        aria-busy={isDeletePending ? true : undefined}
        onClick={() => requestDeleteAction(item.item_id)}
      >
        {isDeletePending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
    </div>
  );
}
