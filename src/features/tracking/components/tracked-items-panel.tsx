import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import { TrackedItemsPanelClient } from "@/features/tracking/components/tracked-items-panel-client";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";
import { getMessages } from "@/lib/messages";

function mapError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

export async function TrackedItemsPanel() {
  const t = getMessages("tracking.errors");
  const auth = await getAuthContext();
  if (!auth) {
    return (
      <TrackedItemsPanelClient
        isAuthenticated={false}
        initialItems={[]}
        initialError={null}
      />
    );
  }

  let initialItems: TrackedItemSummary[] = [];
  let initialError: string | null = null;

  try {
    const response = await listTrackedItemsQuery();
    initialItems = response.items;
  } catch (error) {
    initialError = mapError(error, t("loadTrackedItems"));
  }

  const itemsKey = initialItems
    .map((item) => `${item.item_id}:${item.status}:${item.updated_at}`)
    .join("|");
  const panelKey = `${auth.userId}:${itemsKey}`;

  return (
    <TrackedItemsPanelClient
      key={panelKey}
      isAuthenticated={true}
      initialItems={initialItems}
      initialError={initialError}
    />
  );
}
