import "server-only";

import { getBackendJson } from "@/features/scraper/server/backend-client";
import { readCachedMe, writeCachedMe } from "@/features/tracking/server/me-cache";
import type { MeResponse, TrackedItemsListResponse } from "@/features/tracking/types";

interface GetMeQueryOptions {
  cacheKey?: string | null;
}

export async function getMeQuery(options: GetMeQueryOptions = {}): Promise<MeResponse> {
  const cacheKey = options.cacheKey?.trim() || null;
  if (cacheKey) {
    const cached = readCachedMe(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const me = await getBackendJson<MeResponse>("/api/v1/me", { auth: true });
  if (cacheKey) {
    writeCachedMe(cacheKey, me);
  }
  return me;
}

export async function listTrackedItemsQuery(): Promise<TrackedItemsListResponse> {
  return getBackendJson<TrackedItemsListResponse>("/api/v1/tracked-items", {
    auth: true,
    cache: "no-store",
  });
}

export async function getTrackedItemQuery<TResponse = unknown>(
  itemId: string
): Promise<TResponse> {
  return getBackendJson<TResponse>(`/api/v1/tracked-items/${itemId}`, { auth: true });
}
