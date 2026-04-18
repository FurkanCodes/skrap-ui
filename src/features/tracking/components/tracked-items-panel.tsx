import { headers } from "next/headers";

import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import { TrackedItemsPanelClient } from "@/features/tracking/components/tracked-items-panel-client";
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
  return "Unable to load tracked items.";
}

export async function TrackedItemsPanel() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });

  if (!session?.user) {
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
    initialError = mapError(error);
  }

  return (
    <TrackedItemsPanelClient
      isAuthenticated={true}
      initialItems={initialItems}
      initialError={initialError}
    />
  );
}
