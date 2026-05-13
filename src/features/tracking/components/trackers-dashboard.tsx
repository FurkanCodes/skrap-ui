"use client";

import { TrackersDashboardClient } from "@/features/tracking/components/trackers-dashboard-client";
import { TrackersDashboardSkeleton } from "@/features/tracking/components/trackers-dashboard/ui/trackers-dashboard-skeleton";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useWorkspaceData } from "@/features/workspace-data/workspace-data-provider";

export function TrackersDashboard({
  highlightedTrackerId = null,
}: {
  highlightedTrackerId?: string | null;
}) {
  const { isAuthenticated, me } = useViewer();
  const { trackedItems, telegramStatus } = useWorkspaceData();

  if (!isAuthenticated) {
    return (
      <TrackersDashboardClient
        isAuthenticated={false}
        initialItems={[]}
        initialError={null}
        telegramConnected={null}
        telegramBotUsername={null}
        highlightedTrackerId={null}
      />
    );
  }

  const viewerLoading = !me;
  const trackedItemsLoading = trackedItems.data === null && !trackedItems.error;
  const telegramStatusLoading =
    telegramStatus.data === null && !telegramStatus.error;

  if (viewerLoading || trackedItemsLoading || telegramStatusLoading) {
    return <TrackersDashboardSkeleton />;
  }

  return (
    <TrackersDashboardClient
      isAuthenticated={true}
      initialItems={trackedItems.data ?? []}
      initialError={trackedItems.error}
      telegramConnected={telegramStatus.data?.connected ?? null}
      telegramBotUsername={telegramStatus.data?.bot_username ?? null}
      highlightedTrackerId={highlightedTrackerId}
    />
  );
}
