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

export function ViewerProvider({
  children,
  initialMe,
  initialUserKey,
  initialSessionUser,
}: ViewerProviderProps) {
  const router = useRouter();
  const didRefreshForExpiry = useRef(false);
  const viewerRecord = useSyncExternalStore(
    subscribeViewerCache,
    readViewerCache,
    () => null
  );
  const viewerUserKey = viewerRecord?.userKey ?? null;
  const viewerExpiresAt = viewerRecord?.expiresAt ?? null;

  useEffect(() => {
    if (initialMe && initialUserKey) {
      writeViewerCache(initialMe, initialUserKey);
      return;
    }

    readViewerCache();
  }, [initialMe, initialUserKey]);

  useEffect(() => {
    if (!initialUserKey) {
      clearViewerCacheStore();
      didRefreshForExpiry.current = false;
      return;
    }

    const snapshot = getViewerCacheSnapshot();
    if (!snapshot) {
      return;
    }

    if (snapshot.userKey !== initialUserKey) {
      clearViewerCacheStore();
      return;
    }

    if (!isViewerCacheFresh(snapshot)) {
      clearViewerCacheStore();
      if (!didRefreshForExpiry.current) {
        didRefreshForExpiry.current = true;
        router.refresh();
      }
      return;
    }

    didRefreshForExpiry.current = false;
  }, [initialUserKey, router, viewerRecord?.expiresAt, viewerRecord?.userKey]);

  useEffect(() => {
    if (!initialUserKey || !viewerUserKey || !viewerExpiresAt) {
      return;
    }

    if (viewerUserKey !== initialUserKey) {
      clearViewerCacheStore();
      return;
    }

    const expiresInMs = viewerExpiresAt - Date.now();
    if (expiresInMs <= 0) {
      clearViewerCacheStore();
      if (!didRefreshForExpiry.current) {
        didRefreshForExpiry.current = true;
        router.refresh();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      const snapshot = getViewerCacheSnapshot();
      if (!snapshot) {
        return;
      }
      if (snapshot.userKey !== initialUserKey) {
        clearViewerCacheStore();
        return;
      }
      if (isViewerCacheFresh(snapshot)) {
        return;
      }

      clearViewerCacheStore();
      if (!didRefreshForExpiry.current) {
        didRefreshForExpiry.current = true;
        router.refresh();
      }
    }, expiresInMs);

    return () => window.clearTimeout(timer);
  }, [
    initialUserKey,
    router,
    viewerExpiresAt,
    viewerUserKey,
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
