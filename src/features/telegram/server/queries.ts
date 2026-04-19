import "server-only";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import { getTelegramStatusTag } from "@/features/telegram/server/cache-tags";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { getAuthContext } from "@/lib/auth-dal";

export async function getTelegramStatusQuery(): Promise<TelegramActiveStatusResponse> {
  const auth = await getAuthContext();
  if (!auth) {
    throw new Error("Authentication required.");
  }

  return getBackendJson<TelegramActiveStatusResponse>("/api/v1/integrations/telegram/status", {
    auth: true,
    cache: "force-cache",
    next: {
      tags: [getTelegramStatusTag(auth.userId)],
    },
  });
}
