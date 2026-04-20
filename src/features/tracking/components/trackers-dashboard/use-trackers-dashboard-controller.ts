"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  ACTION_ERROR_DURATION_MS,
  ACTION_LOADING_MIN_DURATION_MS,
  ACTION_SUCCESS_DURATION_MS,
  INTERVAL_OPTIONS,
} from "@/features/tracking/components/trackers-dashboard/constants";
import type {
  ActionFeedbackState,
  FilterKey,
  ItemAction,
  ItemMutationAction,
  TrackingMode,
} from "@/features/tracking/components/trackers-dashboard/types";
import {
  applyItemAction,
  mapError,
  mergePatchedItem,
  normalizeBotUsername,
  parseNumberish,
  reconcileItemsPreservingOrder,
  sleep,
  toTrackedItemSummary,
} from "@/features/tracking/components/trackers-dashboard/utils";
import {
  createTrackedItemAction,
  deleteTrackedItemAction,
  pauseTrackedItemAction,
  previewTrackedItemAction,
  resumeTrackedItemAction,
} from "@/features/tracking/server/actions";
import type { TrackedItemPreview, TrackedItemSummary } from "@/features/tracking/types";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

interface UseTrackersDashboardControllerParams {
  initialItems: TrackedItemSummary[];
  initialError: string | null;
  telegramConnected: boolean | null;
  telegramBotUsername: string | null;
}

const ROW_ACTION_ERROR_DURATION_MS = 4000;
const DELETE_ROW_EXIT_DURATION_MS = 240;

export function useTrackersDashboardController({
  initialItems,
  initialError,
  telegramConnected,
  telegramBotUsername,
}: UseTrackersDashboardControllerParams) {
  const router = useRouter();
  const { me } = useViewer();

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
  const [filter, setFilter] = useState<FilterKey>("all");

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
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<TrackedItemPreview | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("alert");
  const [targetAmount, setTargetAmount] = useState("");
  const [interval, setInterval] = useState("60");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isSavePending, setIsSavePending] = useState(false);

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = Math.max(1, Number(me?.entitlement.min_check_interval_minutes) || 1);
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
  const canCreateTracker = !trackersLimitReached;
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

    const saved = items.reduce((sum, item) => {
      const current = parseNumberish(item.last_amount);
      const target = parseNumberish(item.target_amount);
      if (!current || !target) {
        return sum;
      }
      return sum + Math.max(current - target, 0);
    }, 0);

    return {
      active,
      alerts,
      saved,
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

      if (filter === "all") {
        return true;
      }
      if (filter === "active" || filter === "paused") {
        return item.status === filter;
      }
      if (filter === "alert" || filter === "monitor") {
        return item.tracking_mode === filter;
      }
      return true;
    });
  }, [filter, items, query]);

  const resetModal = useCallback(() => {
    setModalStep(1);
    setUrlInput("");
    setPreview(null);
    setTrackingMode("alert");
    setTargetAmount("");
    setInterval(defaultInterval);
    setModalError(null);
  }, [defaultInterval]);

  const openModal = useCallback(() => {
    if (trackersLimitReached) {
      setPageError(
        `Tracker limit reached (${maxTrackers}) for ${(me?.entitlement.plan_key ?? "current").toUpperCase()} plan.`
      );
      return;
    }

    setPageError(null);
    resetModal();
    setIsModalOpen(true);
  }, [maxTrackers, me?.entitlement.plan_key, resetModal, trackersLimitReached]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const refresh = useCallback(() => {
    setPageError(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

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
              setResumeFeedbackState(itemId, "idle");
            }, ACTION_SUCCESS_DURATION_MS);
          } catch (error) {
            setTimedRowActionError(itemId, mapError(error));
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
              setPauseFeedbackState(itemId, "idle");
            }, ACTION_SUCCESS_DURATION_MS);
          } catch (error) {
            setTimedRowActionError(itemId, mapError(error));
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
          setTimedRowActionError(itemId, mapError(error));
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
      setDeletePending,
      setDeleteExiting,
      setItemActionPending,
      setPauseFeedbackState,
      setRowActionError,
      setResumeFeedbackState,
      setTimedRowActionError,
      startActionTransition,
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

  const fetchProductPreview = useCallback(() => {
    setModalError(null);

    startPreviewTransition(async () => {
      try {
        const nextPreview = await previewTrackedItemAction(urlInput);
        setPreview(nextPreview);

        const parsedAmount = parseNumberish(nextPreview.amount);
        if (parsedAmount && parsedAmount > 0) {
          const nextTarget = (parsedAmount * 0.9).toFixed(2);
          setTargetAmount(nextTarget);
        }

        setModalStep(2);
      } catch (error) {
        setModalError(mapError(error));
      }
    });
  }, [urlInput, startPreviewTransition]);

  const saveTracker = useCallback(() => {
    if (!preview) {
      setModalError("Fetch product info first.");
      return;
    }

    if (items.length >= maxTrackers) {
      setModalError(
        `Tracker limit reached (${maxTrackers}) for ${(me?.entitlement.plan_key ?? "current").toUpperCase()} plan.`
      );
      return;
    }

    const parsedInterval = Number(interval);
    if (
      !Number.isInteger(parsedInterval) ||
      parsedInterval < minInterval ||
      parsedInterval > 10080
    ) {
      setModalError(`Interval must be between ${minInterval} and 10080.`);
      return;
    }

    if (trackingMode === "alert" && !targetAmount.trim()) {
      setModalError("Target price is required in Price Alert mode.");
      return;
    }

    if (isSavePending) {
      return;
    }

    const fallbackCommittedItem: TrackedItemSummary = {
      item_id: crypto.randomUUID(),
      source_url: preview.url,
      product_name: preview.product_name ?? preview.url,
      image_url: preview.image_url,
      status: "active",
      tracking_mode: trackingMode,
      check_interval_minutes: parsedInterval,
      target_amount: trackingMode === "alert" ? targetAmount.trim() : null,
      last_amount: preview.amount,
      currency: preview.currency,
      next_check_at: null,
      updated_at: new Date().toISOString(),
    };

    // Apply optimistic row immediately on user click (not inside transition),
    // so the list updates before the backend roundtrip finishes.
    setModalError(null);
    setPageError(null);
    setIsSavePending(true);

    void (async () => {
      try {
        const response = (await createTrackedItemAction({
          url: preview.url,
          sites: preview.site_key ? [preview.site_key] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: trackingMode === "alert" ? targetAmount.trim() : null,
        })) as { item?: unknown };

        const committedItem = toTrackedItemSummary(response.item, fallbackCommittedItem);
        setItemsState((current) => {
          const withoutDuplicate = current.filter(
            (item) => item.item_id !== committedItem.item_id
          );
          return [committedItem, ...withoutDuplicate];
        });
        closeModal();
      } catch (error) {
        setModalError(mapError(error));
      } finally {
        setIsSavePending(false);
      }
    })();
  }, [
    closeModal,
    interval,
    isSavePending,
    items.length,
    maxTrackers,
    me?.entitlement.plan_key,
    minInterval,
    preview,
    targetAmount,
    trackingMode,
  ]);

  return {
    botUsername,
    displayError,
    filter,
    filteredItems,
    interval,
    isActionPending,
    isModalOpen,
    isMutating,
    isPreviewPending,
    isRefreshPending,
    isSavePending,
    items,
    canCreateTracker,
    creditsExhausted,
    creditsResetAt,
    maxTrackers,
    me,
    monthlyCredits,
    minInterval,
    modalError,
    modalStep,
    deleteConfirmItemId,
    dismissRowActionError,
    pendingActionItemIds,
    pendingDeleteItemIds,
    exitingDeleteItemIds,
    pauseFeedbackByItemId,
    rowActionErrorByItemId,
    preview,
    query,
    remainingCredits,
    resumeFeedbackByItemId,
    summary,
    targetAmount,
    telegramConnected,
    trackingMode,
    urlInput,
    consumedCredits,
    cancelDeleteAction,
    closeModal,
    confirmDeleteAction,
    fetchProductPreview,
    openModal,
    refresh,
    requestDeleteAction,
    runItemAction,
    saveTracker,
    setFilter,
    setInterval,
    setModalStep,
    setQuery,
    setTargetAmount,
    setTrackingMode,
    setUrlInput,
  };
}

export type TrackersDashboardController = ReturnType<typeof useTrackersDashboardController>;
