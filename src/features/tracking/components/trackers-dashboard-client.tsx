"use client";

import { TrackersDashboardAuthenticatedView, TrackersDashboardUnauthenticated } from "@/features/tracking/components/trackers-dashboard/trackers-dashboard-presentational";
import type { TrackersDashboardClientProps } from "@/features/tracking/components/trackers-dashboard/types";
import { useTrackersDashboardController } from "@/features/tracking/components/trackers-dashboard/use-trackers-dashboard-controller";

interface AuthenticatedTrackersDashboardClientProps {
  initialItems: TrackersDashboardClientProps["initialItems"];
  initialError: TrackersDashboardClientProps["initialError"];
  telegramConnected: TrackersDashboardClientProps["telegramConnected"];
  telegramBotUsername: TrackersDashboardClientProps["telegramBotUsername"];
}

function AuthenticatedTrackersDashboardClient({
  initialItems,
  initialError,
  telegramConnected,
  telegramBotUsername,
}: AuthenticatedTrackersDashboardClientProps) {
  const controller = useTrackersDashboardController({
    initialItems,
    initialError,
    telegramConnected,
    telegramBotUsername,
  });

  return <TrackersDashboardAuthenticatedView controller={controller} />;
}

export function TrackersDashboardClient({
  isAuthenticated,
  initialItems,
  initialError,
  telegramConnected,
  telegramBotUsername,
}: TrackersDashboardClientProps) {
  if (!isAuthenticated) {
    return <TrackersDashboardUnauthenticated />;
  }

  return (
    <AuthenticatedTrackersDashboardClient
      initialItems={initialItems}
      initialError={initialError}
      telegramConnected={telegramConnected}
      telegramBotUsername={telegramBotUsername}
    />
  );
}
