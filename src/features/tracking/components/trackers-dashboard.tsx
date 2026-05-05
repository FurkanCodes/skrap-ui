"use client";

import { TrackersDashboardClient } from "@/features/tracking/components/trackers-dashboard-client";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useWorkspaceData } from "@/features/workspace-data/workspace-data-provider";

export function TrackersDashboard({
  highlightedTrackerId = null,
}: {
  highlightedTrackerId?: string | null;
}) {
  const { isAuthenticated } = useViewer();
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
