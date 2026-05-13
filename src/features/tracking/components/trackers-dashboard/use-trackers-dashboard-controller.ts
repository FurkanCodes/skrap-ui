"use client";

import { getMessages } from "@/lib/messages";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { extractUrls } from "@/features/scraper/utils";
import type { PriceListingResponse } from "@/features/scraper/types";
import {
  ACTION_ERROR_DURATION_MS,
  ACTION_LOADING_MIN_DURATION_MS,
  ACTION_SUCCESS_DURATION_MS,
  INTERVAL_OPTIONS,
} from "@/features/tracking/components/trackers-dashboard/constants";
import type {
  ActionFeedbackState,
  BulkTrackerDraft,
  ModeFilterKey,
  ItemAction,
  ItemMutationAction,
  StatusFilterKey,
  TrackerUrlInputRow,
  TrackingMode,
} from "@/features/tracking/components/trackers-dashboard/types";
import {
  applyItemAction,
  getInitialBulkDraftId,
  getIntervalValidationError,
  getSuggestedTargetAmount,
  mapError,
  mergePatchedItem,
  normalizeHttpUrl,
  normalizeBotUsername,
  normalizePositiveTargetAmount,
  parseNumberish,
  reconcileItemsPreservingOrder,
  resolveExternalUrl,
  sleep,
  syncBulkDraftSelectionLimits,
  toTrackedItemSummary,
} from "@/features/tracking/components/trackers-dashboard/utils";
import { resolveEffectiveMinIntervalMinutes } from "@/features/tracking/interval-policy";
import {
  createTrackedItemsBulkAction,
  deleteTrackedItemAction,
  patchTrackedItemAction,
  pauseTrackedItemAction,
  previewTrackedItemsAction,
  resumeTrackedItemAction,
} from "@/features/tracking/server/actions";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { useWorkspaceData } from "@/features/workspace-data/workspace-data-provider";

interface UseTrackersDashboardControllerParams {
  initialItems: TrackedItemSummary[];
  initialError: string | null;
  telegramConnected: boolean | null;
  telegramBotUsername: string | null;
  highlightedTrackerId: string | null;
}

const ROW_ACTION_ERROR_DURATION_MS = 4000;
const DELETE_ROW_EXIT_DURATION_MS = 240;
const BULK_SUCCESS_MESSAGE_TIMEOUT_MS = 2500;

function createUrlInputRow(value = ""): TrackerUrlInputRow {
  return {
    id: crypto.randomUUID(),
    value,
  };
}

function dedupeNormalizedUrls(values: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const normalized = normalizeHttpUrl(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function getStableListings(listings: PriceListingResponse[]): PriceListingResponse[] {
  return listings.filter((listing) => (listing.listing_url ?? "").trim().length > 0);
}

function getDefaultSelectedListingId(listings: PriceListingResponse[]): string | null {
  return getStableListings(listings)[0]?.item_id ?? null;
}

function resolveSelectedListing(
  listings: PriceListingResponse[],
  selectedListingId: string | null
): PriceListingResponse | null {
  if (selectedListingId) {
    return listings.find((listing) => listing.item_id === selectedListingId) ?? null;
  }
  return null;
}

export function useTrackersDashboardController({
  initialItems,
  initialError,
  telegramConnected,
  telegramBotUsername,
  highlightedTrackerId,
}: UseTrackersDashboardControllerParams) {
  const t = getMessages("tracking.dashboard.controller");
  const { me } = useViewer();
  const { refreshers, patchers } = useWorkspaceData();
  const { loadTrackedItems, loadTelegramStatus } = refreshers;
  const { setTrackedItems, upsertTrackedItem, removeTrackedItem } = patchers;

  const [itemsState, setItemsState] = useState<TrackedItemSummary[]>(initialItems);
  const [locallyDeletedItemIds, setLocallyDeletedItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const mergedItems = useMemo(
    () => reconcileItemsPreservingOrder(itemsState, initialItems, locallyDeletedItemIds),
    [itemsState, initialItems, locallyDeletedItemIds]
  );
  const items = mergedItems;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilterKey>("all");

  const [pageError, setPageError] = useState<string | null>(null);
  const [rowActionErrorByItemId, setRowActionErrorByItemId] = useState<
    Record<string, string>
  >({});
  const [pendingActionItemIds, setPendingActionItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingDeleteItemIds, setPendingDeleteItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const [exitingDeleteItemIds, setExitingDeleteItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const [isActionTransitionPending, startActionTransition] = useTransition();
  const [resumeFeedbackByItemId, setResumeFeedbackByItemId] = useState<
    Record<string, ActionFeedbackState>
  >({});
  const [pauseFeedbackByItemId, setPauseFeedbackByItemId] = useState<
    Record<string, ActionFeedbackState>
  >({});
  const resumeFeedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pauseFeedbackTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const rowActionErrorTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const deleteExitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [urlRows, setUrlRows] = useState<TrackerUrlInputRow[]>(() => [createUrlInputRow()]);
  const [drafts, setDrafts] = useState<BulkTrackerDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sharedTrackingMode, setSharedTrackingMode] = useState<TrackingMode>("alert");
  const [sharedInterval, setSharedInterval] = useState("60");
  const [sharedNotifyOnPriceIncrease, setSharedNotifyOnPriceIncrease] = useState(false);
  const [sharedNotifyOnStockChange, setSharedNotifyOnStockChange] = useState(false);
  const [bulkResultSummary, setBulkResultSummary] = useState<{
    successCount: number;
    failureCount: number;
  } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isSavePending, setIsSavePending] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTrackingMode, setEditTrackingMode] = useState<TrackingMode>("alert");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editInterval, setEditInterval] = useState("60");
  const [editNotifyOnPriceIncrease, setEditNotifyOnPriceIncrease] = useState(false);
  const [editNotifyOnStockChange, setEditNotifyOnStockChange] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [isEditSavePending, setIsEditSavePending] = useState(false);

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = resolveEffectiveMinIntervalMinutes({
    planKey: me?.entitlement.plan_key,
    entitlementMinIntervalMinutes: Number(me?.entitlement.min_check_interval_minutes),
  });
  const monthlyCredits = Math.max(
    0,
    Number(me?.usage?.monthly_check_units ?? me?.entitlement.monthly_check_units) || 0
  );
  const consumedCredits = Math.max(0, Number(me?.usage?.consumed_check_units) || 0);
  const remainingCredits = Math.max(
    0,
    Number(me?.usage?.remaining_check_units ?? monthlyCredits - consumedCredits) || 0
  );
  const trackersLimitReached = items.length >= maxTrackers;
  const createTrackerDisabledReason = useMemo(() => {
    if (trackersLimitReached) {
      return t("trackerLimitReached", {
        maxTrackers,
        plan: (me?.entitlement.plan_key ?? "current").toUpperCase(),
      });
    }

    if (telegramConnected === false) {
      return t("telegramRequiredToCreate");
    }

    return null;
  }, [
    maxTrackers,
    me?.entitlement.plan_key,
    t,
    telegramConnected,
    trackersLimitReached,
  ]);
  const canCreateTracker = createTrackerDisabledReason === null;
  const creditsExhausted = monthlyCredits > 0 && remainingCredits <= 0;
  const creditsResetAt = me?.usage?.period_end ?? null;
  const displayError = pageError ?? initialError;
  const botUsername = normalizeBotUsername(telegramBotUsername);
  const isActionPending = pendingActionItemIds.size > 0;
  const isMutating = isActionPending || isRefreshPending || isActionTransitionPending;
  const defaultInterval = useMemo(() => {
    const matched = INTERVAL_OPTIONS.find((option) => option.value >= minInterval);
    return String(matched?.value ?? minInterval);
  }, [minInterval]);
  const remainingSlots = Math.max(0, maxTrackers - items.length);
  const resolvedActiveDraftId = useMemo(() => {
    if (drafts.length === 0) {
      return null;
    }
    if (activeDraftId && drafts.some((draft) => draft.clientId === activeDraftId)) {
      return activeDraftId;
    }
    return getInitialBulkDraftId(drafts);
  }, [activeDraftId, drafts]);
  const activeDraft = useMemo(
    () =>
      resolvedActiveDraftId
        ? (drafts.find((draft) => draft.clientId === resolvedActiveDraftId) ?? null)
        : null,
    [drafts, resolvedActiveDraftId]
  );
  const selectedReadyDrafts = useMemo(
    () => drafts.filter((draft) => draft.previewStatus === "ready" && draft.selected),
    [drafts]
  );
  const hasInvalidSelectedDraft = useMemo(() => {
    return selectedReadyDrafts.some((draft) => {
      if (getIntervalValidationError(draft.interval, minInterval)) {
        return true;
      }

      if (draft.trackingMode === "alert" && normalizePositiveTargetAmount(draft.targetAmount) === null) {
        return true;
      }

      return false;
    });
  }, [minInterval, selectedReadyDrafts]);
  const canSaveDrafts =
    selectedReadyDrafts.length > 0 &&
    !hasInvalidSelectedDraft &&
    !isPreviewPending &&
    !isSavePending;

  const clearResumeFeedbackTimer = useCallback((itemId: string) => {
    const activeTimer = resumeFeedbackTimersRef.current.get(itemId);
    if (activeTimer) {
      clearTimeout(activeTimer);
      resumeFeedbackTimersRef.current.delete(itemId);
    }
  }, []);

  const clearPauseFeedbackTimer = useCallback((itemId: string) => {
    const activeTimer = pauseFeedbackTimersRef.current.get(itemId);
    if (activeTimer) {
      clearTimeout(activeTimer);
      pauseFeedbackTimersRef.current.delete(itemId);
    }
  }, []);

  const setResumeFeedbackState = useCallback((itemId: string, state: ActionFeedbackState) => {
    setResumeFeedbackByItemId((current) => {
      if (state === "idle") {
        if (!(itemId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[itemId];
        return next;
      }

      if (current[itemId] === state) {
        return current;
      }

      return { ...current, [itemId]: state };
    });
  }, []);

  const setPauseFeedbackState = useCallback((itemId: string, state: ActionFeedbackState) => {
    setPauseFeedbackByItemId((current) => {
      if (state === "idle") {
        if (!(itemId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[itemId];
        return next;
      }

      if (current[itemId] === state) {
        return current;
      }

      return { ...current, [itemId]: state };
    });
  }, []);

  const scheduleResumeFeedback = useCallback(
    (itemId: string, callback: () => void, durationMs: number) => {
      clearResumeFeedbackTimer(itemId);

      const timer = setTimeout(() => {
        resumeFeedbackTimersRef.current.delete(itemId);
        callback();
      }, durationMs);

      resumeFeedbackTimersRef.current.set(itemId, timer);
    },
    [clearResumeFeedbackTimer]
  );

  const schedulePauseFeedback = useCallback(
    (itemId: string, callback: () => void, durationMs: number) => {
      clearPauseFeedbackTimer(itemId);

      const timer = setTimeout(() => {
        pauseFeedbackTimersRef.current.delete(itemId);
        callback();
      }, durationMs);

      pauseFeedbackTimersRef.current.set(itemId, timer);
    },
    [clearPauseFeedbackTimer]
  );

  const setItemActionPending = useCallback((itemId: string, pending: boolean) => {
    setPendingActionItemIds((current) => {
      const hasItem = current.has(itemId);
      if (pending === hasItem) {
        return current;
      }

      const next = new Set(current);
      if (pending) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const setDeletePending = useCallback((itemId: string, pending: boolean) => {
    setPendingDeleteItemIds((current) => {
      const hasItem = current.has(itemId);
      if (pending === hasItem) {
        return current;
      }

      const next = new Set(current);
      if (pending) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const clearDeleteExitTimer = useCallback((itemId: string) => {
    const timer = deleteExitTimersRef.current.get(itemId);
    if (timer) {
      clearTimeout(timer);
      deleteExitTimersRef.current.delete(itemId);
    }
  }, []);

  const setDeleteExiting = useCallback(
    (itemId: string, exiting: boolean) => {
      setExitingDeleteItemIds((current) => {
        const hasItem = current.has(itemId);
        if (exiting === hasItem) {
          return current;
        }

        const next = new Set(current);
        if (exiting) {
          next.add(itemId);
        } else {
          next.delete(itemId);
        }
        return next;
      });
    },
    []
  );

  const clearRowActionErrorTimer = useCallback((itemId: string) => {
    const timer = rowActionErrorTimersRef.current.get(itemId);
    if (timer) {
      clearTimeout(timer);
      rowActionErrorTimersRef.current.delete(itemId);
    }
  }, []);

  const setRowActionError = useCallback(
    (itemId: string, message: string | null) => {
      clearRowActionErrorTimer(itemId);
      setRowActionErrorByItemId((current) => {
        if (!message) {
          if (!(itemId in current)) {
            return current;
          }
          const next = { ...current };
          delete next[itemId];
          return next;
        }

        if (current[itemId] === message) {
          return current;
        }

        return { ...current, [itemId]: message };
      });
    },
    [clearRowActionErrorTimer]
  );

  const dismissRowActionError = useCallback(
    (itemId: string) => {
      setRowActionError(itemId, null);
    },
    [setRowActionError]
  );

  const setTimedRowActionError = useCallback(
    (itemId: string, message: string) => {
      setRowActionError(itemId, message);
      const timer = setTimeout(() => {
        rowActionErrorTimersRef.current.delete(itemId);
        setRowActionError(itemId, null);
      }, ROW_ACTION_ERROR_DURATION_MS);
      rowActionErrorTimersRef.current.set(itemId, timer);
    },
    [setRowActionError]
  );

  useEffect(() => {
    const resumeTimers = resumeFeedbackTimersRef.current;
    const pauseTimers = pauseFeedbackTimersRef.current;
    const rowErrorTimers = rowActionErrorTimersRef.current;
    const deleteExitTimers = deleteExitTimersRef.current;
    return () => {
      resumeTimers.forEach((timer) => clearTimeout(timer));
      pauseTimers.forEach((timer) => clearTimeout(timer));
      rowErrorTimers.forEach((timer) => clearTimeout(timer));
      deleteExitTimers.forEach((timer) => clearTimeout(timer));
      resumeTimers.clear();
      pauseTimers.clear();
      rowErrorTimers.clear();
      deleteExitTimers.clear();
    };
  }, []);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.status === "active").length;
    const alerts = items.filter((item) => item.tracking_mode === "alert").length;
    const savedByCurrency = new Map<string, number>();
    for (const item of items) {
      const current = parseNumberish(item.last_amount);
      const target = parseNumberish(item.target_amount);
      if (current === null || target === null) {
        continue;
      }
      const diff = Math.max(current - target, 0);
      if (diff <= 0) {
        continue;
      }

      const currency = (item.currency ?? "N/A").trim().toUpperCase() || "N/A";
      savedByCurrency.set(currency, (savedByCurrency.get(currency) ?? 0) + diff);
    }

    const savedBreakdown = Array.from(savedByCurrency.entries())
      .map(([currency, amount]) => ({ currency, amount }))
      .sort((left, right) => right.amount - left.amount);

    return {
      active,
      alerts,
      savedBreakdown,
      consumedCredits,
      remainingCredits,
      monthlyCredits,
    };
  }, [consumedCredits, items, monthlyCredits, remainingCredits]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        (item.product_name ?? "").toLowerCase().includes(normalizedQuery) ||
        item.source_url.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (modeFilter !== "all" && item.tracking_mode !== modeFilter) {
        return false;
      }

      return true;
    });
  }, [items, modeFilter, query, statusFilter]);
  const editingItem = useMemo(
    () =>
      editingItemId
        ? (items.find((item) => item.item_id === editingItemId) ?? null)
        : null,
    [editingItemId, items]
  );

  const resetModal = useCallback(() => {
    setModalStep(1);
    setUrlRows([createUrlInputRow()]);
    setDrafts([]);
    setActiveDraftId(null);
    setSharedTrackingMode("alert");
    setSharedInterval(defaultInterval);
    setSharedNotifyOnPriceIncrease(false);
    setSharedNotifyOnStockChange(false);
    setBulkResultSummary(null);
    setModalError(null);
  }, [defaultInterval]);

  const openModal = useCallback(() => {
    if (createTrackerDisabledReason) {
      setPageError(createTrackerDisabledReason);
      return;
    }

    setPageError(null);
    resetModal();
    setIsModalOpen(true);
  }, [
    createTrackerDisabledReason,
    resetModal,
  ]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const setUrlRowValue = useCallback((rowId: string, value: string) => {
    setUrlRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, value } : row))
    );
    setModalError(null);
  }, []);

  const addUrlRow = useCallback((afterRowId?: string) => {
    setUrlRows((current) => {
      const nextRow = createUrlInputRow();
      if (!afterRowId) {
        return [...current, nextRow];
      }

      const index = current.findIndex((row) => row.id === afterRowId);
      if (index < 0) {
        return [...current, nextRow];
      }

      return [...current.slice(0, index + 1), nextRow, ...current.slice(index + 1)];
    });
  }, []);

  const removeUrlRow = useCallback((rowId: string) => {
    setUrlRows((current) => {
      if (current.length <= 1) {
        return [{ ...current[0], value: "" }];
      }

      const next = current.filter((row) => row.id !== rowId);
      return next.length === 0 ? [createUrlInputRow()] : next;
    });
    setModalError(null);
  }, []);

  const handleUrlRowPaste = useCallback((rowId: string, pastedText: string): boolean => {
    const parsedUrls = dedupeNormalizedUrls(extractUrls(pastedText));
    if (parsedUrls.length <= 1) {
      return false;
    }

    setUrlRows((current) => {
      const rowIndex = current.findIndex((row) => row.id === rowId);
      if (rowIndex < 0) {
        return current;
      }

      const existingNormalized = new Set(
        current
          .filter((row) => row.id !== rowId)
          .map((row) => normalizeHttpUrl(row.value))
          .filter((value): value is string => value !== null)
      );
      const uniquePastedUrls = parsedUrls.filter((url) => !existingNormalized.has(url));
      if (uniquePastedUrls.length === 0) {
        return current;
      }

      const nextRows = uniquePastedUrls.map((url) => createUrlInputRow(url));
      return [
        ...current.slice(0, rowIndex),
        ...nextRows,
        ...current.slice(rowIndex + 1),
      ];
    });
    setModalError(null);
    return true;
  }, []);

  const goBackToUrlStep = useCallback(() => {
    setModalStep(1);
    setBulkResultSummary(null);
    setModalError(null);
    if (drafts.length > 0) {
      setUrlRows(drafts.map((draft) => createUrlInputRow(draft.rawUrl)));
    }
  }, [drafts]);

  const reviewUrlRows = useCallback(() => {
    const normalizedUrls = dedupeNormalizedUrls(urlRows.map((row) => row.value));
    if (normalizedUrls.length === 0) {
      setModalError(t("addValidProductUrl"));
      return;
    }

    const firstRowByNormalizedUrl = new Map<string, string>();
    for (const row of urlRows) {
      const normalized = normalizeHttpUrl(row.value);
      if (!normalized || firstRowByNormalizedUrl.has(normalized)) {
        continue;
      }
      firstRowByNormalizedUrl.set(normalized, row.id);
    }

    setModalError(null);
    setBulkResultSummary(null);
    startPreviewTransition(async () => {
      try {
        const results = await previewTrackedItemsAction(normalizedUrls);
        let selectedReadyCount = 0;
        const seededDrafts: BulkTrackerDraft[] = results.map((result) => {
          const isReady = result.success;
          const shouldSelect = isReady && selectedReadyCount < remainingSlots;
          const selectedListingId = isReady
            ? getDefaultSelectedListingId(result.listings)
            : null;
          const selectedListing = resolveSelectedListing(
            result.listings,
            selectedListingId
          );
          const amount = selectedListing?.amount ?? result.amount;
          const currency = selectedListing?.currency ?? result.currency;
          if (shouldSelect) {
            selectedReadyCount += 1;
          }

          return {
            clientId: crypto.randomUUID(),
            sourceRowId: firstRowByNormalizedUrl.get(result.url) ?? null,
            rawUrl: result.url,
            normalizedUrl: result.url,
            scrapeResultRef: result.result_ref,
            previewStatus: isReady ? "ready" : "failed",
            selected: shouldSelect,
            overLimit: false,
            previewError: isReady ? null : (result.error ?? t("previewUrlFailed")),
            submitError: null,
            productName: isReady ? (result.product_name ?? result.url) : null,
            imageUrl: result.image_url,
            amount,
            currency,
            siteKey: result.site_key,
            listings: result.listings,
            selectedListingId,
            trackingMode: sharedTrackingMode,
            interval: sharedInterval,
            targetAmount: isReady ? getSuggestedTargetAmount(amount) : "",
            notifyOnPriceIncrease: sharedNotifyOnPriceIncrease,
            notifyOnStockChange: sharedNotifyOnStockChange,
            modeOverridden: false,
            intervalOverridden: false,
            notifyOnPriceIncreaseOverridden: false,
            notifyOnStockChangeOverridden: false,
          };
        });

        const syncedDrafts = syncBulkDraftSelectionLimits(seededDrafts, remainingSlots);
        setDrafts(syncedDrafts);
        setActiveDraftId(getInitialBulkDraftId(syncedDrafts));
        setModalStep(2);
      } catch (error) {
        setModalError(mapError(error, t("requestFailed")));
      }
    });
  }, [
    remainingSlots,
    sharedInterval,
    sharedNotifyOnPriceIncrease,
    sharedNotifyOnStockChange,
    sharedTrackingMode,
    startPreviewTransition,
    t,
    urlRows,
  ]);

  const setActiveDraft = useCallback((clientId: string) => {
    setActiveDraftId(clientId);
  }, []);

  const toggleDraftSelection = useCallback(
    (clientId: string) => {
      setDrafts((current) => {
        const toggledDrafts = current.map((draft) => {
          if (draft.clientId !== clientId || draft.previewStatus !== "ready") {
            return draft;
          }
          if (!draft.selected && draft.overLimit) {
            return draft;
          }
          return { ...draft, selected: !draft.selected, submitError: null };
        });
        return syncBulkDraftSelectionLimits(toggledDrafts, remainingSlots);
      });
      setBulkResultSummary(null);
    },
    [remainingSlots]
  );

  const setSharedTrackingModeAndSeed = useCallback(
    (value: TrackingMode) => {
      setSharedTrackingMode(value);
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.previewStatus !== "ready" || draft.modeOverridden) {
            return draft;
          }
          return {
            ...draft,
            trackingMode: value,
            targetAmount: value === "monitor" ? "" : draft.targetAmount,
          };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setSharedIntervalAndSeed = useCallback(
    (value: string) => {
      setSharedInterval(value);
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.previewStatus !== "ready" || draft.intervalOverridden) {
            return draft;
          }
          return { ...draft, interval: value };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setSharedNotifyOnPriceIncreaseAndSeed = useCallback(
    (enabled: boolean) => {
      setSharedNotifyOnPriceIncrease(enabled);
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.previewStatus !== "ready" || draft.notifyOnPriceIncreaseOverridden) {
            return draft;
          }
          return { ...draft, notifyOnPriceIncrease: enabled };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setSharedNotifyOnStockChangeAndSeed = useCallback(
    (enabled: boolean) => {
      setSharedNotifyOnStockChange(enabled);
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.previewStatus !== "ready" || draft.notifyOnStockChangeOverridden) {
            return draft;
          }
          return { ...draft, notifyOnStockChange: enabled };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftTrackingMode = useCallback(
    (clientId: string, value: TrackingMode) => {
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.clientId !== clientId) {
            return draft;
          }
          return {
            ...draft,
            trackingMode: value,
            targetAmount: value === "monitor" ? "" : draft.targetAmount,
            modeOverridden: true,
            submitError: null,
          };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftInterval = useCallback(
    (clientId: string, value: string) => {
      setDrafts((current) => {
        const next = current.map((draft) =>
          draft.clientId === clientId
            ? {
                ...draft,
                interval: value,
                intervalOverridden: true,
                submitError: null,
              }
            : draft
        );
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftTargetAmount = useCallback(
    (clientId: string, value: string) => {
      setDrafts((current) => {
        const next = current.map((draft) =>
          draft.clientId === clientId
            ? {
                ...draft,
                targetAmount: value,
                submitError: null,
              }
            : draft
        );
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftSelectedListing = useCallback(
    (clientId: string, listingId: string | null) => {
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.clientId !== clientId) {
            return draft;
          }
          const selectedListing = resolveSelectedListing(draft.listings, listingId);
          return {
            ...draft,
            selectedListingId: selectedListing?.item_id ?? null,
            amount: selectedListing?.amount ?? draft.amount,
            currency: selectedListing?.currency ?? draft.currency,
            targetAmount:
              draft.trackingMode === "alert"
                ? getSuggestedTargetAmount(selectedListing?.amount ?? draft.amount)
                : draft.targetAmount,
            submitError: null,
          };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftNotifyOnPriceIncrease = useCallback(
    (clientId: string, enabled: boolean) => {
      setDrafts((current) => {
        const next = current.map((draft) =>
          draft.clientId === clientId
            ? {
                ...draft,
                notifyOnPriceIncrease: enabled,
                notifyOnPriceIncreaseOverridden: true,
                submitError: null,
              }
            : draft
        );
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftNotifyOnStockChange = useCallback(
    (clientId: string, enabled: boolean) => {
      setDrafts((current) => {
        const next = current.map((draft) =>
          draft.clientId === clientId
            ? {
                ...draft,
                notifyOnStockChange: enabled,
                notifyOnStockChangeOverridden: true,
                submitError: null,
              }
            : draft
        );
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });
    },
    [remainingSlots]
  );

  const setDraftRawUrl = useCallback(
    (clientId: string, value: string) => {
      const sourceRowId = drafts.find((draft) => draft.clientId === clientId)?.sourceRowId ?? null;
      setDrafts((current) => {
        const next = current.map((draft) => {
          if (draft.clientId !== clientId) {
            return draft;
          }
          return {
            ...draft,
            rawUrl: value,
            scrapeResultRef: null,
            previewStatus: "failed" as const,
            selected: false,
            overLimit: false,
            previewError: null,
            submitError: null,
            listings: [],
            selectedListingId: null,
          };
        });
        return syncBulkDraftSelectionLimits(next, remainingSlots);
      });

      if (sourceRowId) {
        setUrlRows((current) =>
          current.map((row) => (row.id === sourceRowId ? { ...row, value } : row))
        );
      }
    },
    [drafts, remainingSlots]
  );

  const retryDraftPreview = useCallback(
    (clientId: string) => {
      const draft = drafts.find((entry) => entry.clientId === clientId);
      if (!draft) {
        return;
      }

      const normalized = normalizeHttpUrl(draft.rawUrl);
      if (!normalized) {
        setDrafts((current) =>
          current.map((entry) =>
            entry.clientId === clientId
              ? {
                  ...entry,
                  previewStatus: "failed" as const,
                  previewError: t("enterValidProductUrl"),
                }
              : entry
          )
        );
        return;
      }

      startPreviewTransition(async () => {
        try {
          const [result] = await previewTrackedItemsAction([normalized]);
          setDrafts((current) => {
            const selectedReadyCount = current.filter(
              (entry) =>
                entry.clientId !== clientId &&
                entry.previewStatus === "ready" &&
                entry.selected
            ).length;
            const canSelect = selectedReadyCount < remainingSlots;
            const next = current.map((entry) => {
              if (entry.clientId !== clientId) {
                return entry;
              }

              if (!result.success) {
                return {
                  ...entry,
                  rawUrl: normalized,
                  normalizedUrl: normalized,
                  scrapeResultRef: result.result_ref,
                  previewStatus: "failed" as const,
                  selected: false,
                  overLimit: false,
                  previewError: result.error ?? t("previewUrlFailed"),
                  submitError: null,
                  productName: null,
                  imageUrl: result.image_url,
                  amount: result.amount,
                  currency: result.currency,
                  siteKey: result.site_key,
                  listings: result.listings,
                  selectedListingId: null,
                };
              }
              const selectedListingId = getDefaultSelectedListingId(result.listings);
              const selectedListing = resolveSelectedListing(
                result.listings,
                selectedListingId
              );
              const amount = selectedListing?.amount ?? result.amount;
              const currency = selectedListing?.currency ?? result.currency;

              return {
                ...entry,
                rawUrl: normalized,
                normalizedUrl: normalized,
                scrapeResultRef: result.result_ref,
                previewStatus: "ready" as const,
                selected: canSelect,
                overLimit: false,
                previewError: null,
                submitError: null,
                productName: result.product_name ?? result.url,
                imageUrl: result.image_url,
                amount,
                currency,
                siteKey: result.site_key,
                listings: result.listings,
                selectedListingId,
                targetAmount:
                  entry.targetAmount || getSuggestedTargetAmount(amount),
              };
            });
            return syncBulkDraftSelectionLimits(next, remainingSlots);
          });
          setActiveDraftId(clientId);
        } catch (error) {
          setModalError(mapError(error, t("requestFailed")));
        }
      });
    },
    [drafts, remainingSlots, startPreviewTransition, t]
  );

  useEffect(() => {
    if (!bulkResultSummary || bulkResultSummary.failureCount > 0) {
      return;
    }

    const timer = setTimeout(() => {
      setBulkResultSummary(null);
    }, BULK_SUCCESS_MESSAGE_TIMEOUT_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [bulkResultSummary]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItemId(null);
    setEditModalError(null);
  }, []);

  const refresh = useCallback(() => {
    setPageError(null);
    startRefreshTransition(() => {
      void Promise.all([
        loadTrackedItems({ force: true }),
        loadTelegramStatus({ force: true }),
      ]);
    });
  }, [loadTelegramStatus, loadTrackedItems, startRefreshTransition]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
    setModeFilter("all");
  }, []);

  const runItemAction = useCallback(
    (itemId: string, action: ItemAction) => {
      if (isRefreshPending || pendingActionItemIds.has(itemId)) {
        return;
      }

      setRowActionError(itemId, null);
      setItemActionPending(itemId, true);
      if (action === "delete") {
        setDeletePending(itemId, true);
      }
      const itemAction: ItemMutationAction = { type: action, itemId };

      if (action === "resume") {
        clearResumeFeedbackTimer(itemId);
        setResumeFeedbackState(itemId, "loading");

        void (async () => {
          const resumeActionStartedAt = Date.now();
          try {
            const patchResult = await resumeTrackedItemAction(itemId);
            const elapsed = Date.now() - resumeActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setResumeFeedbackState(itemId, "success");

            scheduleResumeFeedback(itemId, () => {
              setItemsState((current) =>
                mergePatchedItem(current, itemId, patchResult, "active")
              );
              const patched = mergePatchedItem(items, itemId, patchResult, "active").find(
                (item) => item.item_id === itemId
              );
              if (patched) {
                upsertTrackedItem(patched);
              }
              setResumeFeedbackState(itemId, "idle");
            }, ACTION_SUCCESS_DURATION_MS);
          } catch (error) {
            setTimedRowActionError(itemId, mapError(error, t("requestFailed")));
            const elapsed = Date.now() - resumeActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setResumeFeedbackState(itemId, "error");
            scheduleResumeFeedback(itemId, () => {
              setResumeFeedbackState(itemId, "idle");
            }, ACTION_ERROR_DURATION_MS);
          } finally {
            setItemActionPending(itemId, false);
          }
        })();

        return;
      }

      if (action === "pause") {
        clearPauseFeedbackTimer(itemId);
        setPauseFeedbackState(itemId, "loading");

        void (async () => {
          const pauseActionStartedAt = Date.now();
          try {
            const patchResult = await pauseTrackedItemAction(itemId);
            const elapsed = Date.now() - pauseActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setPauseFeedbackState(itemId, "success");

            schedulePauseFeedback(itemId, () => {
              setItemsState((current) =>
                mergePatchedItem(current, itemId, patchResult, "paused")
              );
              const patched = mergePatchedItem(items, itemId, patchResult, "paused").find(
                (item) => item.item_id === itemId
              );
              if (patched) {
                upsertTrackedItem(patched);
              }
              setPauseFeedbackState(itemId, "idle");
            }, ACTION_SUCCESS_DURATION_MS);
          } catch (error) {
            setTimedRowActionError(itemId, mapError(error, t("requestFailed")));
            const elapsed = Date.now() - pauseActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setPauseFeedbackState(itemId, "error");
            schedulePauseFeedback(itemId, () => {
              setPauseFeedbackState(itemId, "idle");
            }, ACTION_ERROR_DURATION_MS);
          } finally {
            setItemActionPending(itemId, false);
          }
        })();

        return;
      }

      startActionTransition(async () => {
        try {
          await deleteTrackedItemAction(itemId);
          clearDeleteExitTimer(itemId);
          setDeleteExiting(itemId, true);
          const exitTimer = setTimeout(() => {
            deleteExitTimersRef.current.delete(itemId);
            setItemsState((current) => applyItemAction(current, itemAction));
            removeTrackedItem(itemId);
            setLocallyDeletedItemIds((current) => {
              const next = new Set(current);
              next.add(itemId);
              return next;
            });
            setDeleteExiting(itemId, false);
            setItemActionPending(itemId, false);
            setDeletePending(itemId, false);
          }, DELETE_ROW_EXIT_DURATION_MS);
          deleteExitTimersRef.current.set(itemId, exitTimer);
        } catch (error) {
          setTimedRowActionError(itemId, mapError(error, t("requestFailed")));
          setDeleteExiting(itemId, false);
          setItemActionPending(itemId, false);
          setDeletePending(itemId, false);
        }
      });
    },
    [
      clearPauseFeedbackTimer,
      clearResumeFeedbackTimer,
      clearDeleteExitTimer,
      isRefreshPending,
      pendingActionItemIds,
      schedulePauseFeedback,
      scheduleResumeFeedback,
      removeTrackedItem,
      setDeletePending,
      setDeleteExiting,
      setItemActionPending,
      setPauseFeedbackState,
      setRowActionError,
      setResumeFeedbackState,
      setTimedRowActionError,
      startActionTransition,
      t,
      items,
      upsertTrackedItem,
    ]
  );

  const requestDeleteAction = useCallback(
    (itemId: string) => {
      if (isRefreshPending || pendingActionItemIds.has(itemId)) {
        return;
      }

      setDeleteConfirmItemId((current) => (current === itemId ? null : itemId));
    },
    [isRefreshPending, pendingActionItemIds]
  );

  const cancelDeleteAction = useCallback(() => {
    setDeleteConfirmItemId(null);
  }, []);

  const confirmDeleteAction = useCallback(() => {
    if (!deleteConfirmItemId) {
      return;
    }

    const itemId = deleteConfirmItemId;
    setDeleteConfirmItemId(null);
    runItemAction(itemId, "delete");
  }, [deleteConfirmItemId, runItemAction]);

  const setEditTrackingModeWithNormalization = useCallback((value: TrackingMode) => {
    setEditTrackingMode(value);
    if (value === "monitor") {
      setEditTargetAmount("");
    }
  }, []);

  const openEditModal = useCallback(
    (itemId: string) => {
      const item = items.find((entry) => entry.item_id === itemId);
      if (!item) {
        setPageError(t("trackerNotFound"));
        return;
      }

      setDeleteConfirmItemId(null);
      setPageError(null);
      setRowActionError(itemId, null);
      setEditModalError(null);
      setEditingItemId(item.item_id);
      setEditTrackingMode(item.tracking_mode);
      setEditTargetAmount(item.target_amount ?? "");
      setEditInterval(String(item.check_interval_minutes));
      setEditNotifyOnPriceIncrease(Boolean(item.notify_on_price_increase));
      setEditNotifyOnStockChange(Boolean(item.notify_on_stock_change));
      setIsEditModalOpen(true);
    },
    [items, setRowActionError, t]
  );

  const saveEditedTracker = useCallback(() => {
    if (!editingItemId || isEditSavePending) {
      return;
    }

    const currentItem = items.find((item) => item.item_id === editingItemId);
    if (!currentItem) {
      setEditModalError(t("trackerNotFound"));
      return;
    }

    const intervalValidationError = getIntervalValidationError(editInterval, minInterval);
    if (intervalValidationError) {
      setEditModalError(intervalValidationError);
      return;
    }
    const parsedInterval = Number(editInterval);

    const normalizedTargetAmount =
      editTrackingMode === "alert"
        ? normalizePositiveTargetAmount(editTargetAmount)
        : null;
    if (editTrackingMode === "alert" && normalizedTargetAmount === null) {
      setEditModalError(t("targetPricePositive"));
      return;
    }

    setEditModalError(null);
    setIsEditSavePending(true);
    setItemActionPending(editingItemId, true);

    const itemId = editingItemId;
    void (async () => {
      try {
        const patchResult = await patchTrackedItemAction(itemId, {
          check_interval_minutes: parsedInterval,
          target_amount: normalizedTargetAmount,
          notify_on_price_increase: editNotifyOnPriceIncrease,
          notify_on_stock_change: editNotifyOnStockChange,
        });
        setItemsState((current) => {
          const latest = current.find((item) => item.item_id === itemId);
          return mergePatchedItem(
            current,
            itemId,
            patchResult,
            latest?.status ?? currentItem.status
          );
        });
        const patched = mergePatchedItem(
          items,
          itemId,
          patchResult,
          currentItem.status
        ).find((item) => item.item_id === itemId);
        if (patched) {
          upsertTrackedItem(patched);
        }
        closeEditModal();
      } catch (error) {
        setEditModalError(mapError(error, t("requestFailed")));
      } finally {
        setIsEditSavePending(false);
        setItemActionPending(itemId, false);
      }
    })();
  }, [
    closeEditModal,
    editInterval,
    editNotifyOnPriceIncrease,
    editNotifyOnStockChange,
    editTargetAmount,
    editTrackingMode,
    editingItemId,
    isEditSavePending,
    items,
    minInterval,
    setItemActionPending,
    t,
    upsertTrackedItem,
  ]);

  const saveTracker = useCallback(() => {
    if (!canSaveDrafts) {
      setModalError(t("selectValidTracker"));
      return;
    }

    setModalError(null);
    setPageError(null);
    setBulkResultSummary(null);
    setIsSavePending(true);

    const selectedDrafts = selectedReadyDrafts;
    const selectedDraftIds = new Set(selectedDrafts.map((draft) => draft.clientId));
    const payloadItems = selectedDrafts.map((draft) => {
      const normalizedTargetAmount =
        draft.trackingMode === "alert"
          ? normalizePositiveTargetAmount(draft.targetAmount)
          : null;
      return {
        url: draft.normalizedUrl,
        scrape_result_ref:
          draft.selectedListingId && draft.scrapeResultRef ? draft.scrapeResultRef : null,
        selected_listing_id: draft.selectedListingId,
        check_interval_minutes: Number(draft.interval),
        target_amount: normalizedTargetAmount,
        notify_on_price_increase: draft.notifyOnPriceIncrease,
        notify_on_stock_change: draft.notifyOnStockChange,
      };
    });

    void (async () => {
      try {
        const response = await createTrackedItemsBulkAction({
          items: payloadItems,
          fetch_mode: "auto",
        });

        const successItems: TrackedItemSummary[] = [];
        const failedDraftIds = new Set<string>();
        const failureMessageByDraftId = new Map<string, string>();

        for (const result of response.results) {
          const draft = selectedDrafts[result.index];
          if (!draft) {
            continue;
          }

          if (result.success && result.item) {
            const parsedInterval = Number(draft.interval);
            const normalizedTargetAmount =
              draft.trackingMode === "alert"
                ? normalizePositiveTargetAmount(draft.targetAmount)
                : null;
            const fallbackItem: TrackedItemSummary = {
              item_id: crypto.randomUUID(),
              source_url: draft.normalizedUrl,
              product_name: draft.productName ?? draft.normalizedUrl,
              image_url: draft.imageUrl,
              status: "active",
              tracking_mode: draft.trackingMode,
              check_interval_minutes: parsedInterval,
              target_amount: normalizedTargetAmount,
              notify_on_price_increase: draft.notifyOnPriceIncrease,
              notify_on_stock_change: draft.notifyOnStockChange,
              created_via: "dashboard",
              outbound_url: null,
              outbound_is_affiliate: false,
              tracked_listing_id: draft.selectedListingId,
              tracked_listing_url:
                resolveExternalUrl(
                  resolveSelectedListing(draft.listings, draft.selectedListingId)?.listing_url,
                  draft.normalizedUrl
                ) ??
                null,
              tracked_listing_seller:
                resolveSelectedListing(draft.listings, draft.selectedListingId)?.seller ?? null,
              last_amount: draft.amount,
              currency: draft.currency,
              availability: null,
              next_check_at: null,
              updated_at: new Date().toISOString(),
            };
            successItems.push(toTrackedItemSummary(result.item, fallbackItem));
            continue;
          }

          failedDraftIds.add(draft.clientId);
          failureMessageByDraftId.set(
            draft.clientId,
            result.error ?? t("createTrackerFailed")
          );
        }

        if (successItems.length > 0) {
          setItemsState((current) => {
            const incomingById = new Map(successItems.map((item) => [item.item_id, item]));
            const merged = current.filter((item) => !incomingById.has(item.item_id));
            return [...successItems, ...merged];
          });
          const incomingById = new Map(successItems.map((item) => [item.item_id, item]));
          const merged = items.filter((item) => !incomingById.has(item.item_id));
          setTrackedItems([...successItems, ...merged]);
        }

        const updatedRemainingSlots = Math.max(0, remainingSlots - successItems.length);
        setDrafts((current) => {
          const nextDrafts = current
            .filter((draft) => !selectedDraftIds.has(draft.clientId) || failedDraftIds.has(draft.clientId))
            .map((draft) => {
              if (!failedDraftIds.has(draft.clientId)) {
                return { ...draft, submitError: null };
              }
              return {
                ...draft,
                selected: draft.previewStatus === "ready",
                overLimit: false,
                submitError:
                  failureMessageByDraftId.get(draft.clientId) ?? t("createTrackerFailed"),
              };
            });
          return syncBulkDraftSelectionLimits(nextDrafts, updatedRemainingSlots);
        });

        const successCount = successItems.length;
        const failureCount = failedDraftIds.size;
        setBulkResultSummary({ successCount, failureCount });

        if (failureCount === 0) {
          closeModal();
          return;
        }

        setModalStep(2);
      } catch (error) {
        setModalError(mapError(error, t("requestFailed")));
      } finally {
        setIsSavePending(false);
      }
    })();
  }, [canSaveDrafts, closeModal, remainingSlots, selectedReadyDrafts, t, setTrackedItems, items]);

  return {
    botUsername,
    displayError,
    statusFilter,
    modeFilter,
    filteredItems,
    isActionPending,
    isModalOpen,
    isMutating,
    isPreviewPending,
    isRefreshPending,
    isSavePending,
    isEditModalOpen,
    isEditSavePending,
    items,
    canCreateTracker,
    createTrackerDisabledReason,
    creditsExhausted,
    creditsResetAt,
    maxTrackers,
    me,
    monthlyCredits,
    minInterval,
    modalError,
    bulkResultSummary,
    remainingSlots,
    canSaveDrafts,
    activeDraft,
    activeDraftId: resolvedActiveDraftId,
    drafts,
    sharedTrackingMode,
    sharedInterval,
    sharedNotifyOnPriceIncrease,
    sharedNotifyOnStockChange,
    urlRows,
    editModalError,
    modalStep,
    editingItem,
    editInterval,
    editTargetAmount,
    editTrackingMode,
    editNotifyOnPriceIncrease,
    editNotifyOnStockChange,
    deleteConfirmItemId,
    dismissRowActionError,
    pendingActionItemIds,
    pendingDeleteItemIds,
    exitingDeleteItemIds,
    pauseFeedbackByItemId,
    rowActionErrorByItemId,
    query,
    remainingCredits,
    resumeFeedbackByItemId,
    summary,
    telegramConnected,
    highlightedTrackerId,
    consumedCredits,
    cancelDeleteAction,
    closeModal,
    closeEditModal,
    confirmDeleteAction,
    goBackToUrlStep,
    reviewUrlRows,
    openModal,
    openEditModal,
    refresh,
    requestDeleteAction,
    retryDraftPreview,
    runItemAction,
    saveTracker,
    saveEditedTracker,
    setActiveDraft,
    addUrlRow,
    setEditInterval,
    setEditNotifyOnPriceIncrease,
    setEditNotifyOnStockChange,
    setEditTargetAmount,
    setEditTrackingMode: setEditTrackingModeWithNormalization,
    setDraftInterval,
    setDraftNotifyOnPriceIncrease,
    setDraftNotifyOnStockChange,
    setDraftRawUrl,
    setDraftSelectedListing,
    setDraftTargetAmount,
    setDraftTrackingMode,
    setSharedInterval: setSharedIntervalAndSeed,
    setSharedNotifyOnPriceIncrease: setSharedNotifyOnPriceIncreaseAndSeed,
    setSharedNotifyOnStockChange: setSharedNotifyOnStockChangeAndSeed,
    setSharedTrackingMode: setSharedTrackingModeAndSeed,
    setUrlRowValue,
    removeUrlRow,
    handleUrlRowPaste,
    toggleDraftSelection,
    clearFilters,
    setModeFilter,
    setQuery,
    setStatusFilter,
  };
}

export type TrackersDashboardController = ReturnType<typeof useTrackersDashboardController>;
