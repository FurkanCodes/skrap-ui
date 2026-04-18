import "server-only";

import type { MeResponse } from "@/features/tracking/types";

interface CachedMeRecord {
  data: MeResponse;
  expiresAt: number;
  updatedAt: number;
}

const ME_CACHE_TTL_MS = 3 * 60 * 60 * 1000;
const ME_CACHE_SKEW_MS = 30_000;
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

  if (cached.expiresAt <= now + ME_CACHE_SKEW_MS) {
    meCache.delete(cacheKey);
    return null;
  }

  cached.updatedAt = now;
  return cached.data;
}

export function writeCachedMe(cacheKey: string, data: MeResponse, now = Date.now()): void {
  meCache.set(cacheKey, {
    data,
    expiresAt: now + ME_CACHE_TTL_MS,
    updatedAt: now,
  });
  pruneMeCache(now);
}

