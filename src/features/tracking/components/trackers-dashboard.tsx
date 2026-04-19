import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { TrackersDashboardClient } from "@/features/tracking/components/trackers-dashboard-client";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";

function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Unable to load trackers.";
}

export async function TrackersDashboard() {
  const auth = await getAuthContext();
  if (!auth) {
    return (
      <TrackersDashboardClient
        isAuthenticated={false}
        initialItems={[]}
        initialError={null}
        telegramConnected={null}
        telegramBotUsername={null}
      />
    );
  }

  let initialItems: TrackedItemSummary[] = [];
  let initialError: string | null = null;
  let telegramConnected: boolean | null = null;
  let telegramBotUsername: string | null = null;

  const [trackedResult, telegramResult] = await Promise.allSettled([
    listTrackedItemsQuery({ userId: auth.userId }),
    getTelegramStatusQuery(),
  ]);

  if (trackedResult.status === "fulfilled") {
    initialItems = trackedResult.value.items;
  } else {
    initialError = mapError(trackedResult.reason);
  }

  if (telegramResult.status === "fulfilled") {
    telegramConnected = telegramResult.value.connected;
    telegramBotUsername = telegramResult.value.bot_username;
  } else {
    telegramConnected = null;
    telegramBotUsername = null;
  }

  const itemsKey = initialItems
    .map((item) => `${item.item_id}:${item.status}:${item.updated_at}`)
    .join("|");
  const dashboardKey = `${auth.userId}:${itemsKey}:${telegramConnected ?? "unknown"}:${telegramBotUsername ?? ""}`;

  return (
    <TrackersDashboardClient
      key={dashboardKey}
      isAuthenticated={true}
      initialItems={initialItems}
      initialError={initialError}
      telegramConnected={telegramConnected}
      telegramBotUsername={telegramBotUsername}
    />
  );
}
