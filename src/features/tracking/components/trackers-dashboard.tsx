import { headers } from "next/headers";

import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { TrackersDashboardClient } from "@/features/tracking/components/trackers-dashboard-client";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { getAuth } from "@/lib/auth";

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

function getSessionUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  return null;
}

export async function TrackersDashboard() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });

  if (!session?.user) {
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

  try {
    const response = await listTrackedItemsQuery({ userId: getSessionUserId(session) });
    initialItems = response.items;
  } catch (error) {
    initialError = mapError(error);
  }

  try {
    const telegram = await getTelegramStatusQuery();
    telegramConnected = telegram.connected;
    telegramBotUsername = telegram.bot_username;
  } catch {
    telegramConnected = null;
    telegramBotUsername = null;
  }

  return (
    <TrackersDashboardClient
      isAuthenticated={true}
      initialItems={initialItems}
      initialError={initialError}
      telegramConnected={telegramConnected}
      telegramBotUsername={telegramBotUsername}
    />
  );
}
