"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { BillingCurrentResponse } from "@/features/billing/types";
import type { SiteInfoResponse } from "@/features/scraper/types";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import type { TrackedItemSummary, TrackedItemsListResponse } from "@/features/tracking/types";

type WorkspaceDomainKey =
  | "trackedItems"
  | "billingCurrent"
  | "telegramStatus"
  | "supportedSites";

interface WorkspaceDomainState<TData> {
  data: TData | null;
  error: string | null;
  fetchedAt: number | null;
  expiresAt: number | null;
  loading: boolean;
}

interface WorkspaceState {
  trackedItems: WorkspaceDomainState<TrackedItemSummary[]>;
  billingCurrent: WorkspaceDomainState<BillingCurrentResponse>;
  telegramStatus: WorkspaceDomainState<TelegramActiveStatusResponse>;
  supportedSites: WorkspaceDomainState<SiteInfoResponse[]>;
}

interface PersistedDomain<TData> {
  data: TData | null;
  fetchedAt: number | null;
  expiresAt: number | null;
}

interface PersistedWorkspaceState {
  version: number;
  userKey: string;
  trackedItems: PersistedDomain<TrackedItemSummary[]>;
  billingCurrent: PersistedDomain<BillingCurrentResponse>;
  telegramStatus: PersistedDomain<TelegramActiveStatusResponse>;
  supportedSites: PersistedDomain<SiteInfoResponse[]>;
}

interface PersistedDomainDataByKey {
  trackedItems: TrackedItemSummary[];
  billingCurrent: BillingCurrentResponse;
  telegramStatus: TelegramActiveStatusResponse;
  supportedSites: SiteInfoResponse[];
}

interface WorkspaceDataContextValue {
  trackedItems: WorkspaceDomainState<TrackedItemSummary[]>;
  billingCurrent: WorkspaceDomainState<BillingCurrentResponse>;
  telegramStatus: WorkspaceDomainState<TelegramActiveStatusResponse>;
  supportedSites: WorkspaceDomainState<SiteInfoResponse[]>;
  isAuthenticated: boolean;
  refreshers: {
    loadTrackedItems: (options?: { force?: boolean }) => Promise<TrackedItemSummary[] | null>;
    loadBillingCurrent: (options?: { force?: boolean }) => Promise<BillingCurrentResponse | null>;
    loadTelegramStatus: (options?: { force?: boolean }) => Promise<TelegramActiveStatusResponse | null>;
    loadSupportedSites: (options?: { force?: boolean }) => Promise<SiteInfoResponse[] | null>;
  };
  patchers: {
    setTrackedItems: (items: TrackedItemSummary[]) => void;
    upsertTrackedItem: (item: TrackedItemSummary) => void;
    removeTrackedItem: (itemId: string) => void;
    setBillingCurrent: (billing: BillingCurrentResponse | null) => void;
    setTelegramStatus: (status: TelegramActiveStatusResponse | null) => void;
  };
}

interface WorkspaceDataProviderProps {
  children: React.ReactNode;
  initialUserKey: string | null;
}

const WORKSPACE_CACHE_STORAGE_KEY = "skrap.workspace-cache.v1";
const WORKSPACE_CACHE_VERSION = 1;
const TTL_TRACKED_ITEMS_MS = 5 * 60_000;
const TTL_BILLING_MS = 5 * 60_000;
const TTL_TELEGRAM_MS = 5 * 60_000;
const TTL_SUPPORTED_SITES_MS = 60 * 60_000;

let memoryWorkspaceCache: PersistedWorkspaceState | null = null;

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

function createEmptyPersistedState(userKey: string): PersistedWorkspaceState {
  const emptyDomain = {
    data: null,
    fetchedAt: null,
    expiresAt: null,
  };

  return {
    version: WORKSPACE_CACHE_VERSION,
    userKey,
    trackedItems: { ...emptyDomain },
    billingCurrent: { ...emptyDomain },
    telegramStatus: { ...emptyDomain },
    supportedSites: { ...emptyDomain },
  };
}

function createEmptyDomainState<TData>(): WorkspaceDomainState<TData> {
  return {
    data: null,
    error: null,
    fetchedAt: null,
    expiresAt: null,
    loading: false,
  };
}

function createEmptyWorkspaceState(): WorkspaceState {
  return {
    trackedItems: createEmptyDomainState<TrackedItemSummary[]>(),
    billingCurrent: createEmptyDomainState<BillingCurrentResponse>(),
    telegramStatus: createEmptyDomainState<TelegramActiveStatusResponse>(),
    supportedSites: createEmptyDomainState<SiteInfoResponse[]>(),
  };
}

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function normalizeUserKey(value: string): string {
  return value.trim();
}

function isValidPersistedState(
  value: unknown
): value is PersistedWorkspaceState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as { version?: unknown; userKey?: unknown };
  if (maybe.version !== WORKSPACE_CACHE_VERSION) {
    return false;
  }

  return (
    typeof maybe.userKey === "string" &&
    maybe.userKey.trim().length > 0
  );
}

function readPersistedState(userKey: string): PersistedWorkspaceState {
  if (memoryWorkspaceCache) {
    if (memoryWorkspaceCache.userKey === userKey) {
      return memoryWorkspaceCache;
    }
    memoryWorkspaceCache = null;
  }

  if (!hasWindow()) {
    return createEmptyPersistedState(userKey);
  }

  try {
    const raw = window.sessionStorage.getItem(WORKSPACE_CACHE_STORAGE_KEY);
    if (!raw) {
      return createEmptyPersistedState(userKey);
    }

    const parsed = JSON.parse(raw);
    if (!isValidPersistedState(parsed)) {
      window.sessionStorage.removeItem(WORKSPACE_CACHE_STORAGE_KEY);
      return createEmptyPersistedState(userKey);
    }

    if (parsed.userKey !== userKey) {
      return createEmptyPersistedState(userKey);
    }

    memoryWorkspaceCache = parsed;
    return parsed;
  } catch {
    return createEmptyPersistedState(userKey);
  }
}

function writePersistedState(state: PersistedWorkspaceState): void {
  memoryWorkspaceCache = state;
  if (!hasWindow()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      WORKSPACE_CACHE_STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch {
    // Ignore write errors and keep memory cache fallback.
  }
}

function toWorkspaceState(state: PersistedWorkspaceState): WorkspaceState {
  return {
    trackedItems: {
      ...state.trackedItems,
      error: null,
      loading: false,
    },
    billingCurrent: {
      ...state.billingCurrent,
      error: null,
      loading: false,
    },
    telegramStatus: {
      ...state.telegramStatus,
      error: null,
      loading: false,
    },
    supportedSites: {
      ...state.supportedSites,
      error: null,
      loading: false,
    },
  };
}

function isExpired(expiresAt: number | null, now = Date.now()): boolean {
  if (!expiresAt) {
    return true;
  }
  return expiresAt <= now;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readError(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return fallback;
}

function isTrackedItemsResponse(value: unknown): value is TrackedItemsListResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray((value as { items?: unknown }).items)
  );
}

function isBillingCurrentResponse(value: unknown): value is BillingCurrentResponse {
  return Boolean(value && typeof value === "object");
}

function isTelegramStatusResponse(value: unknown): value is TelegramActiveStatusResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const maybe = value as {
    connected?: unknown;
    active_chat_id?: unknown;
    bot_username?: unknown;
  };
  return (
    typeof maybe.connected === "boolean" &&
    (typeof maybe.active_chat_id === "string" || maybe.active_chat_id === null) &&
    typeof maybe.bot_username === "string"
  );
}

function isSupportedSitesResponse(
  value: unknown
): value is { sites: SiteInfoResponse[] } {
  return Boolean(
    value &&
      typeof value === "object" &&
      Array.isArray((value as { sites?: unknown }).sites)
  );
}

export function WorkspaceDataProvider({
  children,
  initialUserKey,
}: WorkspaceDataProviderProps) {
  const userKey = normalizeUserKey(initialUserKey ?? "");
  const userKeyRef = useRef(userKey);
  const inFlightRef = useRef<
    Partial<Record<WorkspaceDomainKey, Promise<unknown>>>
  >({});
  const [state, setState] = useState<WorkspaceState>(() => {
    if (!userKey) {
      return createEmptyWorkspaceState();
    }
    return toWorkspaceState(readPersistedState(userKey));
  });

  useEffect(() => {
    if (userKeyRef.current === userKey) {
      return;
    }

    userKeyRef.current = userKey;
    inFlightRef.current = {};
    setState(
      userKey
        ? toWorkspaceState(readPersistedState(userKey))
        : createEmptyWorkspaceState()
    );
  }, [userKey]);

  const updateDomainState = useCallback(
    <K extends WorkspaceDomainKey>(
      key: K,
      updater: (current: WorkspaceState[K]) => WorkspaceState[K]
    ) => {
      setState((current) => ({
        ...current,
        [key]: updater(current[key]),
      }));
    },
    []
  );

  const persistDomain = useCallback(
    <K extends WorkspaceDomainKey>(
      key: K,
      value: PersistedDomainDataByKey[K] | null,
      ttlMs: number,
      now = Date.now()
    ) => {
      if (!userKey) {
        return;
      }
      const persisted = readPersistedState(userKey);
      const nextDomain: PersistedDomain<PersistedDomainDataByKey[K]> = {
        data: value,
        fetchedAt: now,
        expiresAt: now + ttlMs,
      };
      persisted[key] = nextDomain as PersistedWorkspaceState[K];
      writePersistedState(persisted);
    },
    [userKey]
  );

  const loadTrackedItems = useCallback(
    async (options?: { force?: boolean }): Promise<TrackedItemSummary[] | null> => {
      if (!userKey) {
        return null;
      }

      const current = state.trackedItems;
      const stale = isExpired(current.expiresAt);
      if (!options?.force && current.data && !stale) {
        return current.data;
      }

      const existingRequest = inFlightRef.current.trackedItems as
        | Promise<TrackedItemSummary[] | null>
        | undefined;
      if (existingRequest) {
        return existingRequest;
      }

      updateDomainState("trackedItems", (entry) => ({
        ...entry,
        loading: true,
        error: null,
      }));

      const request = (async () => {
        const response = await fetch("/api/tracking/items", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await readJson(response);
        if (!response.ok || !isTrackedItemsResponse(payload)) {
          throw new Error(readError(payload, "Could not load tracked items."));
        }

        const now = Date.now();
        const nextItems = payload.items;
        updateDomainState("trackedItems", () => ({
          data: nextItems,
          error: null,
          fetchedAt: now,
          expiresAt: now + TTL_TRACKED_ITEMS_MS,
          loading: false,
        }));
        persistDomain("trackedItems", nextItems, TTL_TRACKED_ITEMS_MS, now);
        return nextItems;
      })()
        .catch((error) => {
          updateDomainState("trackedItems", (entry) => ({
            ...entry,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load tracked items.",
          }));
          return null;
        })
        .finally(() => {
          delete inFlightRef.current.trackedItems;
        });

      inFlightRef.current.trackedItems = request;
      return request;
    },
    [persistDomain, state.trackedItems, updateDomainState, userKey]
  );

  const loadBillingCurrent = useCallback(
    async (options?: { force?: boolean }): Promise<BillingCurrentResponse | null> => {
      if (!userKey) {
        return null;
      }

      const current = state.billingCurrent;
      const stale = isExpired(current.expiresAt);
      if (!options?.force && current.data && !stale) {
        return current.data;
      }

      const existingRequest = inFlightRef.current.billingCurrent as
        | Promise<BillingCurrentResponse | null>
        | undefined;
      if (existingRequest) {
        return existingRequest;
      }

      updateDomainState("billingCurrent", (entry) => ({
        ...entry,
        loading: true,
        error: null,
      }));

      const request = (async () => {
        const response = await fetch("/api/billing/current", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await readJson(response);
        if (!response.ok || !isBillingCurrentResponse(payload)) {
          throw new Error(readError(payload, "Could not load billing status."));
        }

        const now = Date.now();
        updateDomainState("billingCurrent", () => ({
          data: payload,
          error: null,
          fetchedAt: now,
          expiresAt: now + TTL_BILLING_MS,
          loading: false,
        }));
        persistDomain("billingCurrent", payload, TTL_BILLING_MS, now);
        return payload;
      })()
        .catch((error) => {
          updateDomainState("billingCurrent", (entry) => ({
            ...entry,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load billing status.",
          }));
          return null;
        })
        .finally(() => {
          delete inFlightRef.current.billingCurrent;
        });

      inFlightRef.current.billingCurrent = request;
      return request;
    },
    [persistDomain, state.billingCurrent, updateDomainState, userKey]
  );

  const loadTelegramStatus = useCallback(
    async (
      options?: { force?: boolean }
    ): Promise<TelegramActiveStatusResponse | null> => {
      if (!userKey) {
        return null;
      }

      const current = state.telegramStatus;
      const stale = isExpired(current.expiresAt);
      if (!options?.force && current.data && !stale) {
        return current.data;
      }

      const existingRequest = inFlightRef.current.telegramStatus as
        | Promise<TelegramActiveStatusResponse | null>
        | undefined;
      if (existingRequest) {
        return existingRequest;
      }

      updateDomainState("telegramStatus", (entry) => ({
        ...entry,
        loading: true,
        error: null,
      }));

      const request = (async () => {
        const response = await fetch("/api/telegram/status", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await readJson(response);
        if (!response.ok || !isTelegramStatusResponse(payload)) {
          throw new Error(readError(payload, "Could not load Telegram status."));
        }

        const now = Date.now();
        updateDomainState("telegramStatus", () => ({
          data: payload,
          error: null,
          fetchedAt: now,
          expiresAt: now + TTL_TELEGRAM_MS,
          loading: false,
        }));
        persistDomain("telegramStatus", payload, TTL_TELEGRAM_MS, now);
        return payload;
      })()
        .catch((error) => {
          updateDomainState("telegramStatus", (entry) => ({
            ...entry,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load Telegram status.",
          }));
          return null;
        })
        .finally(() => {
          delete inFlightRef.current.telegramStatus;
        });

      inFlightRef.current.telegramStatus = request;
      return request;
    },
    [persistDomain, state.telegramStatus, updateDomainState, userKey]
  );

  const loadSupportedSites = useCallback(
    async (options?: { force?: boolean }): Promise<SiteInfoResponse[] | null> => {
      if (!userKey) {
        return null;
      }

      const current = state.supportedSites;
      const stale = isExpired(current.expiresAt);
      if (!options?.force && current.data && !stale) {
        return current.data;
      }

      const existingRequest = inFlightRef.current.supportedSites as
        | Promise<SiteInfoResponse[] | null>
        | undefined;
      if (existingRequest) {
        return existingRequest;
      }

      updateDomainState("supportedSites", (entry) => ({
        ...entry,
        loading: true,
        error: null,
      }));

      const request = (async () => {
        const response = await fetch("/api/settings/sites", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = await readJson(response);
        if (!response.ok || !isSupportedSitesResponse(payload)) {
          throw new Error(readError(payload, "Could not load supported sites."));
        }

        const now = Date.now();
        updateDomainState("supportedSites", () => ({
          data: payload.sites,
          error: null,
          fetchedAt: now,
          expiresAt: now + TTL_SUPPORTED_SITES_MS,
          loading: false,
        }));
        persistDomain("supportedSites", payload.sites, TTL_SUPPORTED_SITES_MS, now);
        return payload.sites;
      })()
        .catch((error) => {
          updateDomainState("supportedSites", (entry) => ({
            ...entry,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Could not load supported sites.",
          }));
          return null;
        })
        .finally(() => {
          delete inFlightRef.current.supportedSites;
        });

      inFlightRef.current.supportedSites = request;
      return request;
    },
    [persistDomain, state.supportedSites, updateDomainState, userKey]
  );

  const setTrackedItems = useCallback(
    (items: TrackedItemSummary[]) => {
      const now = Date.now();
      updateDomainState("trackedItems", () => ({
        data: items,
        error: null,
        fetchedAt: now,
        expiresAt: now + TTL_TRACKED_ITEMS_MS,
        loading: false,
      }));
      persistDomain("trackedItems", items, TTL_TRACKED_ITEMS_MS, now);
    },
    [persistDomain, updateDomainState]
  );

  const upsertTrackedItem = useCallback(
    (item: TrackedItemSummary) => {
      const currentItems = state.trackedItems.data ?? [];
      const nextItems = [...currentItems];
      const index = nextItems.findIndex((current) => current.item_id === item.item_id);
      if (index >= 0) {
        nextItems[index] = item;
      } else {
        nextItems.unshift(item);
      }
      setTrackedItems(nextItems);
    },
    [setTrackedItems, state.trackedItems.data]
  );

  const removeTrackedItem = useCallback(
    (itemId: string) => {
      const currentItems = state.trackedItems.data ?? [];
      const nextItems = currentItems.filter((item) => item.item_id !== itemId);
      setTrackedItems(nextItems);
    },
    [setTrackedItems, state.trackedItems.data]
  );

  const setBillingCurrent = useCallback(
    (billing: BillingCurrentResponse | null) => {
      const now = Date.now();
      updateDomainState("billingCurrent", () => ({
        data: billing,
        error: null,
        fetchedAt: now,
        expiresAt: now + TTL_BILLING_MS,
        loading: false,
      }));
      persistDomain("billingCurrent", billing, TTL_BILLING_MS, now);
    },
    [persistDomain, updateDomainState]
  );

  const setTelegramStatus = useCallback(
    (status: TelegramActiveStatusResponse | null) => {
      const now = Date.now();
      updateDomainState("telegramStatus", () => ({
        data: status,
        error: null,
        fetchedAt: now,
        expiresAt: now + TTL_TELEGRAM_MS,
        loading: false,
      }));
      persistDomain("telegramStatus", status, TTL_TELEGRAM_MS, now);
    },
    [persistDomain, updateDomainState]
  );

  useEffect(() => {
    if (!userKey) {
      return;
    }

    const trackedStale =
      !state.trackedItems.data || isExpired(state.trackedItems.expiresAt);
    if (trackedStale) {
      void loadTrackedItems();
    }

    const billingStale =
      !state.billingCurrent.data || isExpired(state.billingCurrent.expiresAt);
    if (billingStale) {
      void loadBillingCurrent();
    }

    const telegramStale =
      !state.telegramStatus.data || isExpired(state.telegramStatus.expiresAt);
    if (telegramStale) {
      void loadTelegramStatus();
    }
  }, [
    loadBillingCurrent,
    loadTelegramStatus,
    loadTrackedItems,
    state.billingCurrent.data,
    state.billingCurrent.expiresAt,
    state.telegramStatus.data,
    state.telegramStatus.expiresAt,
    state.trackedItems.data,
    state.trackedItems.expiresAt,
    userKey,
  ]);

  const value = useMemo<WorkspaceDataContextValue>(
    () => ({
      trackedItems: state.trackedItems,
      billingCurrent: state.billingCurrent,
      telegramStatus: state.telegramStatus,
      supportedSites: state.supportedSites,
      isAuthenticated: Boolean(userKey),
      refreshers: {
        loadTrackedItems,
        loadBillingCurrent,
        loadTelegramStatus,
        loadSupportedSites,
      },
      patchers: {
        setTrackedItems,
        upsertTrackedItem,
        removeTrackedItem,
        setBillingCurrent,
        setTelegramStatus,
      },
    }),
    [
      loadBillingCurrent,
      loadSupportedSites,
      loadTelegramStatus,
      loadTrackedItems,
      removeTrackedItem,
      setBillingCurrent,
      setTelegramStatus,
      setTrackedItems,
      state.billingCurrent,
      state.supportedSites,
      state.telegramStatus,
      state.trackedItems,
      upsertTrackedItem,
      userKey,
    ]
  );

  return (
    <WorkspaceDataContext.Provider value={value}>
      {children}
    </WorkspaceDataContext.Provider>
  );
}

export function useWorkspaceData(): WorkspaceDataContextValue {
  const context = useContext(WorkspaceDataContext);
  if (!context) {
    throw new Error("useWorkspaceData must be used inside WorkspaceDataProvider.");
  }
  return context;
}

export function useOptionalWorkspaceData(): WorkspaceDataContextValue | null {
  return useContext(WorkspaceDataContext);
}
