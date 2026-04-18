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

import { authClient } from "@/lib/auth-client";
import type { MeResponse } from "@/features/tracking/types";
import {
  clearViewerCache as clearViewerCacheStore,
  getViewerCacheSnapshot,
  isViewerCacheFresh,
  readViewerCache,
  subscribeViewerCache,
  writeViewerCache,
} from "@/features/tracking/viewer/viewer-cache";

interface ViewerProviderProps {
  children: React.ReactNode;
  initialMe: MeResponse | null;
  initialUserKey: string | null;
}

interface ViewerContextValue {
  me: MeResponse | null;
  fetchedAt: number | null;
  expiresAt: number | null;
  isFresh: boolean;
  clearViewerCache: () => void;
  refreshViewer: () => void;
}

const ViewerContext = createContext<ViewerContextValue | null>(null);

function getSessionUserKey(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown; email?: unknown; name?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email;
  }

  if (typeof user.name === "string" && user.name.trim().length > 0) {
    return user.name;
  }

  return null;
}

export function ViewerProvider({
  children,
  initialMe,
  initialUserKey,
}: ViewerProviderProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const didRefreshForExpiry = useRef(false);
  const sessionUserKey = useMemo(() => getSessionUserKey(session), [session]);
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
    if (sessionPending) {
      return;
    }

    if (!sessionUserKey) {
      clearViewerCacheStore();
      didRefreshForExpiry.current = false;
      return;
    }

    const snapshot = getViewerCacheSnapshot();
    if (!snapshot) {
      return;
    }

    if (snapshot.userKey !== sessionUserKey) {
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
  }, [router, sessionPending, sessionUserKey, viewerRecord?.expiresAt, viewerRecord?.userKey]);

  useEffect(() => {
    if (sessionPending || !sessionUserKey || !viewerUserKey || !viewerExpiresAt) {
      return;
    }

    if (viewerUserKey !== sessionUserKey) {
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
      if (snapshot.userKey !== sessionUserKey) {
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
    router,
    sessionPending,
    sessionUserKey,
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
    if (sessionPending) {
      return initialMe;
    }
    if (!sessionUserKey || sessionUserKey !== initialUserKey) {
      return null;
    }
    return initialMe;
  }, [initialMe, initialUserKey, sessionPending, sessionUserKey]);

  const value = useMemo<ViewerContextValue>(() => {
    const isFreshRecord = viewerRecord ? isViewerCacheFresh(viewerRecord) : false;
    const me = isFreshRecord ? viewerRecord?.data ?? null : fallbackMe;
    return {
      me,
      fetchedAt: isFreshRecord ? viewerRecord?.fetchedAt ?? null : null,
      expiresAt: isFreshRecord ? viewerRecord?.expiresAt ?? null : null,
      isFresh: isFreshRecord || Boolean(fallbackMe),
      clearViewerCache,
      refreshViewer,
    };
  }, [clearViewerCache, fallbackMe, refreshViewer, viewerRecord]);

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer(): ViewerContextValue {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewer must be used inside ViewerProvider.");
  }
  return context;
}
