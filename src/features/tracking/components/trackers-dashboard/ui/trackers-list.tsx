"use client";

import { Card } from "@/components/ui/card";
import { TrackerRow } from "@/features/tracking/components/trackers-dashboard/ui/tracker-row";
import type { ActionFeedbackState, ItemAction } from "@/features/tracking/components/trackers-dashboard/types";
import type { TrackedItemSummary } from "@/features/tracking/types";

interface TrackersListProps {
  filteredItems: TrackedItemSummary[];
  isRefreshPending: boolean;
  pendingActionItemIds: Set<string>;
  pendingDeleteItemIds: Set<string>;
  pauseFeedbackByItemId: Record<string, ActionFeedbackState>;
  resumeFeedbackByItemId: Record<string, ActionFeedbackState>;
  runItemAction: (itemId: string, action: ItemAction) => void;
  requestDeleteAction: (itemId: string) => void;
}

export function TrackersList({
  filteredItems,
  isRefreshPending,
  pendingActionItemIds,
  pendingDeleteItemIds,
  pauseFeedbackByItemId,
  resumeFeedbackByItemId,
  runItemAction,
  requestDeleteAction,
}: TrackersListProps) {
  if (filteredItems.length === 0) {
    return (
      <div className="space-y-3">
        <Card className="rounded-lg border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No trackers match this view yet.
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredItems.map((item) => (
        <TrackerRow
          key={item.item_id}
          item={item}
          isRefreshPending={isRefreshPending}
          isItemActionPending={pendingActionItemIds.has(item.item_id)}
          isDeletePending={pendingDeleteItemIds.has(item.item_id)}
          pauseFeedbackState={pauseFeedbackByItemId[item.item_id] ?? "idle"}
          resumeFeedbackState={resumeFeedbackByItemId[item.item_id] ?? "idle"}
          runItemAction={runItemAction}
          requestDeleteAction={requestDeleteAction}
        />
      ))}
    </div>
  );
}
