"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";

import type { MeResponse } from "@/features/tracking/types";
import {
  clearViewerCache as clearViewerCacheStore,
  getViewerCacheSnapshot,
  isViewerCacheFresh,
  mergeViewerUsageCache,
  readViewerCache,
  subscribeViewerCache,
  writeViewerCache,
} from "@/features/tracking/viewer/viewer-cache";
import type { ViewerSessionUser } from "@/lib/session-user";

interface ViewerProviderProps {
  children: React.ReactNode;
  initialMe: MeResponse | null;
  initialUserKey: string | null;
  initialSessionUser: ViewerSessionUser | null;
}

interface ViewerContextValue {
  me: MeResponse | null;
  fetchedAt: number | null;
  expiresAt: number | null;
  isFresh: boolean;
  isAuthenticated: boolean;
  sessionPending: boolean;
  sessionUser: ViewerSessionUser | null;
  clearViewerCache: () => void;
  refreshViewer: () => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);
const USAGE_STREAM_PATH = "/api/tracking/me/usage/stream";
const FALLBACK_REFRESH_INTERVAL_MS = 60_000;

function isUsagePayload(value: unknown): value is MeResponse["usage"] {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as {
    user_id?: unknown;
    period_start?: unknown;
    period_end?: unknown;
    monthly_check_units?: unknown;
    consumed_check_units?: unknown;
    remaining_check_units?: unknown;
    updated_at?: unknown;
  };

  return (
    typeof maybe.user_id === "string" &&
    typeof maybe.period_start === "string" &&
    typeof maybe.period_end === "string" &&
    typeof maybe.monthly_check_units === "number" &&
    typeof maybe.consumed_check_units === "number" &&
    typeof maybe.remaining_check_units === "number" &&
    typeof maybe.updated_at === "string"
  );
}

export function ViewerProvider({
  children,
  initialMe,
  initialUserKey,
  initialSessionUser,
}: ViewerProviderProps) {
  const router = useRouter();
  const eventSourceRef = useRef<EventSource | null>(null);
  const fallbackRefreshTimerRef = useRef<number | null>(null);
  const wasHiddenRef = useRef(false);
  const viewerRecord = useSyncExternalStore(
    subscribeViewerCache,
    readViewerCache,
    () => null
  );

  useEffect(() => {
    if (initialMe && initialUserKey) {
      writeViewerCache(initialMe, initialUserKey);
      return;
    }

    readViewerCache();
  }, [initialMe, initialUserKey]);

  const closeUsageStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const clearFallbackRefreshLoop = useCallback(() => {
    if (fallbackRefreshTimerRef.current) {
      clearInterval(fallbackRefreshTimerRef.current);
      fallbackRefreshTimerRef.current = null;
    }
  }, []);

  const startFallbackRefreshLoop = useCallback(() => {
    if (fallbackRefreshTimerRef.current) {
      return;
    }
    fallbackRefreshTimerRef.current = window.setInterval(() => {
      clearViewerCacheStore();
      router.refresh();
    }, FALLBACK_REFRESH_INTERVAL_MS);
  }, [router]);

  const applyUsageUpdate = useCallback(
    (usage: MeResponse["usage"]) => {
      if (!initialUserKey) {
        return;
      }

      const snapshot = getViewerCacheSnapshot();
      if (
        snapshot &&
        snapshot.userKey === initialUserKey &&
        snapshot.data.usage.updated_at >= usage.updated_at
      ) {
        return;
      }

      if (!mergeViewerUsageCache(usage, initialUserKey) && initialMe) {
        writeViewerCache(
          {
            ...initialMe,
            usage,
          },
          initialUserKey
        );
      }
    },
    [initialMe, initialUserKey]
  );

  const connectUsageStream = useCallback(() => {
    if (!initialUserKey || eventSourceRef.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    if (window.document.visibilityState !== "visible") {
      return;
    }
    if (typeof window.EventSource === "undefined") {
      startFallbackRefreshLoop();
      return;
    }

    const stream = new EventSource(USAGE_STREAM_PATH);
    eventSourceRef.current = stream;

    stream.addEventListener("usage", (event) => {
      clearFallbackRefreshLoop();
      try {
        const parsed = JSON.parse(event.data);
        if (!isUsagePayload(parsed)) {
          return;
        }
        applyUsageUpdate(parsed);
      } catch {
        // Ignore malformed stream payloads and wait for next event.
      }
    });

    stream.onopen = () => {
      clearFallbackRefreshLoop();
    };

    stream.onerror = () => {
      startFallbackRefreshLoop();
    };
  }, [
    applyUsageUpdate,
    clearFallbackRefreshLoop,
    initialUserKey,
    startFallbackRefreshLoop,
  ]);

  useEffect(() => {
    if (!initialUserKey) {
      closeUsageStream();
      clearFallbackRefreshLoop();
      clearViewerCacheStore();
      wasHiddenRef.current = false;
      return;
    }

    const snapshot = getViewerCacheSnapshot();
    if (snapshot && snapshot.userKey !== initialUserKey) {
      clearViewerCacheStore();
    }

    connectUsageStream();

    return () => {
      closeUsageStream();
      clearFallbackRefreshLoop();
    };
  }, [
    clearFallbackRefreshLoop,
    closeUsageStream,
    connectUsageStream,
    initialUserKey,
  ]);

  useEffect(() => {
    if (!initialUserKey) {
      return;
    }

    const onVisibilityChange = () => {
      const hidden = window.document.visibilityState !== "visible";
      if (hidden) {
        wasHiddenRef.current = true;
        closeUsageStream();
        clearFallbackRefreshLoop();
        return;
      }

      if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        clearViewerCacheStore();
        router.refresh();
      }
      connectUsageStream();
    };

    window.document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [
    clearFallbackRefreshLoop,
    closeUsageStream,
    connectUsageStream,
    initialUserKey,
    router,
  ]);

  const clearViewerCache = useCallback(() => {
    clearViewerCacheStore();
  }, []);

  const refreshViewer = useCallback(() => {
    clearViewerCacheStore();
    router.refresh();
  }, [router]);

  const fallbackMe = useMemo(() => {
    if (!initialMe || !initialUserKey) {
      return null;
    }
    return initialMe;
  }, [initialMe, initialUserKey]);

  const value = useMemo<ViewerContextValue>(() => {
    const isFreshRecord = viewerRecord ? isViewerCacheFresh(viewerRecord) : false;
    const me = isFreshRecord ? viewerRecord?.data ?? null : fallbackMe;

    return {
      me,
      fetchedAt: isFreshRecord ? viewerRecord?.fetchedAt ?? null : null,
      expiresAt: isFreshRecord ? viewerRecord?.expiresAt ?? null : null,
      isFresh: isFreshRecord || Boolean(fallbackMe),
      isAuthenticated: Boolean(initialUserKey),
      sessionPending: false,
      sessionUser: initialSessionUser,
      clearViewerCache,
      refreshViewer,
    };
  }, [
    clearViewerCache,
    fallbackMe,
    initialUserKey,
    initialSessionUser,
    refreshViewer,
    viewerRecord,
  ]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer(): ViewerContextValue {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used inside ViewerProvider.");
  }
  return context;
}
