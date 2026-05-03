import "server-only";

import type { MeResponse } from "@/features/tracking/types";

interface CachedMeRecord {
  version: number;
  data: MeResponse;
  expiresAt: number;
  updatedAt: number;
}

const ME_CACHE_VERSION = 2;
// Keep this short-lived to preserve fresh bootstrap data while reducing
// repeated backend reads across navigations.
const ME_CACHE_TTL_MS = 60_000;
const ME_CACHE_SKEW_MS = 2_000;
const ME_CACHE_LIMIT = 512;

const meCache = new Map<string, CachedMeRecord>();

function pruneMeCache(now = Date.now()): void {
  for (const [key, cached] of meCache) {
    if (cached.expiresAt <= now + ME_CACHE_SKEW_MS) {
      meCache.delete(key);
    }
  }

  while (meCache.size > ME_CACHE_LIMIT) {
    let oldestKey: string | null = null;
    let oldestSeen = Number.POSITIVE_INFINITY;

    for (const [key, cached] of meCache) {
      if (cached.updatedAt < oldestSeen) {
        oldestSeen = cached.updatedAt;
        oldestKey = key;
      }
    }

    if (!oldestKey) {
      break;
    }
    meCache.delete(oldestKey);
  }
}

export function readCachedMe(cacheKey: string, now = Date.now()): MeResponse | null {
  const cached = meCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.version !== ME_CACHE_VERSION) {
    meCache.delete(cacheKey);
    return null;
  }

  if (cached.expiresAt <= now + ME_CACHE_SKEW_MS) {
    meCache.delete(cacheKey);
    return null;
  }

  cached.updatedAt = now;
  return cached.data;
}

export function writeCachedMe(cacheKey: string, data: MeResponse, now = Date.now()): void {
  meCache.set(cacheKey, {
    version: ME_CACHE_VERSION,
    data,
    expiresAt: now + ME_CACHE_TTL_MS,
    updatedAt: now,
  });
  pruneMeCache(now);
}

export function invalidateCachedMe(cacheKey: string | null | undefined): void {
  const normalizedKey = cacheKey?.trim();
  if (!normalizedKey) {
    return;
  }
  meCache.delete(normalizedKey);
}
