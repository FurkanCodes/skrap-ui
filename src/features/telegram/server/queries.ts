import "server-only";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";

export async function getTelegramStatusQuery(): Promise<TelegramActiveStatusResponse> {
  return getBackendJson<TelegramActiveStatusResponse>("/api/v1/integrations/telegram/status", {
    auth: true,
    cache: "no-store",
  });
}
