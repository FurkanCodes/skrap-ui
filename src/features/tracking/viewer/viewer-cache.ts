import type { MeResponse } from "@/features/tracking/types";

const VIEWER_CACHE_KEY = "skrap.viewer-cache.v1";
const VIEWER_CACHE_VERSION = 2 as const;
// Keep this short because `/me` now includes credit usage that changes
// as background scheduler checks run.
export const VIEWER_CACHE_TTL_MS = 15_000;

export interface ViewerCacheRecord {
  version: typeof VIEWER_CACHE_VERSION;
  data: MeResponse;
  fetchedAt: number;
  expiresAt: number;
  userKey: string;
}

let memoryCache: ViewerCacheRecord | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function isValidRecord(value: unknown): value is ViewerCacheRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as {
    version?: unknown;
    data?: unknown;
    fetchedAt?: unknown;
    expiresAt?: unknown;
    userKey?: unknown;
  };

  return (
    maybe.version === VIEWER_CACHE_VERSION &&
    typeof maybe.fetchedAt === "number" &&
    Number.isFinite(maybe.fetchedAt) &&
    typeof maybe.expiresAt === "number" &&
    Number.isFinite(maybe.expiresAt) &&
    typeof maybe.userKey === "string" &&
    maybe.userKey.trim().length > 0 &&
    Boolean(maybe.data)
  );
}

function readStorageRecord(): ViewerCacheRecord | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(VIEWER_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isValidRecord(parsed)) {
      window.sessionStorage.removeItem(VIEWER_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeStorageRecord(record: ViewerCacheRecord): void {
  if (!hasWindow()) {
    return;
  }

  try {
    window.sessionStorage.setItem(VIEWER_CACHE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage write failures and keep memory cache as fallback.
  }
}

export function createViewerCacheRecord(
  data: MeResponse,
  userKey: string,
  now = Date.now()
): ViewerCacheRecord {
  return {
    version: VIEWER_CACHE_VERSION,
    data,
    fetchedAt: now,
    expiresAt: now + VIEWER_CACHE_TTL_MS,
    userKey,
  };
}

export function isViewerCacheFresh(record: ViewerCacheRecord, now = Date.now()): boolean {
  return record.expiresAt > now;
}

export function getViewerCacheSnapshot(): ViewerCacheRecord | null {
  if (memoryCache) {
    return memoryCache;
  }

  const stored = readStorageRecord();
  if (!stored) {
    return null;
  }

  memoryCache = stored;
  return stored;
}

export function readViewerCache(now = Date.now()): ViewerCacheRecord | null {
  const snapshot = getViewerCacheSnapshot();
  if (!snapshot) {
    return null;
  }

  if (isViewerCacheFresh(snapshot, now)) {
    return snapshot;
  }

  clearViewerCache();
  return null;
}

export function writeViewerCache(
  data: MeResponse,
  userKey: string,
  now = Date.now()
): ViewerCacheRecord {
  const record = createViewerCacheRecord(data, userKey, now);
  memoryCache = record;
  writeStorageRecord(record);
  emit();
  return record;
}

export function clearViewerCache(): void {
  memoryCache = null;

  if (hasWindow()) {
    try {
      window.sessionStorage.removeItem(VIEWER_CACHE_KEY);
    } catch {
      // Ignore storage cleanup failures.
    }
  }

  emit();
}

export function subscribeViewerCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
