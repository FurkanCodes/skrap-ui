"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ACTION_ERROR_DURATION_MS, ACTION_LOADING_MIN_DURATION_MS, ACTION_SUCCESS_DURATION_MS } from "@/features/tracking/components/trackers-dashboard/constants";
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

  const [actionError, setActionError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null);
  const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<TrackedItemPreview | null>(null);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>("alert");
  const [targetAmount, setTargetAmount] = useState("");
  const [interval, setInterval] = useState("60");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();

  const maxTrackers = Number(me?.entitlement.max_active_trackers) || 10;
  const minInterval = Math.max(1, Number(me?.entitlement.min_check_interval_minutes) || 1);
  const displayError = actionError ?? initialError;
  const botUsername = normalizeBotUsername(telegramBotUsername);
  const isMutating = isActionPending || isRefreshPending || isActionTransitionPending;

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

  useEffect(() => {
    const resumeTimers = resumeFeedbackTimersRef.current;
    const pauseTimers = pauseFeedbackTimersRef.current;
    return () => {
      resumeTimers.forEach((timer) => clearTimeout(timer));
      pauseTimers.forEach((timer) => clearTimeout(timer));
      resumeTimers.clear();
      pauseTimers.clear();
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
    };
  }, [items]);

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

  const deleteConfirmItem = useMemo(
    () => items.find((item) => item.item_id === deleteConfirmItemId) ?? null,
    [items, deleteConfirmItemId]
  );

  const resetModal = useCallback(() => {
    setModalStep(1);
    setUrlInput("");
    setPreview(null);
    setTrackingMode("alert");
    setTargetAmount("");
    setInterval("60");
    setModalError(null);
  }, []);

  const openModal = useCallback(() => {
    resetModal();
    setIsModalOpen(true);
  }, [resetModal]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const refresh = useCallback(() => {
    setActionError(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router, startRefreshTransition]);

  const runItemAction = useCallback(
    (itemId: string, action: ItemAction) => {
      if (isMutating) {
        return;
      }

      setBusyItemId(itemId);
      setActionError(null);
      setIsActionPending(true);
      setPendingDeleteItemId(action === "delete" ? itemId : null);
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
            setActionError(mapError(error));
            const elapsed = Date.now() - resumeActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setResumeFeedbackState(itemId, "error");
            scheduleResumeFeedback(itemId, () => {
              setResumeFeedbackState(itemId, "idle");
            }, ACTION_ERROR_DURATION_MS);
          } finally {
            setBusyItemId(null);
            setIsActionPending(false);
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
            setActionError(mapError(error));
            const elapsed = Date.now() - pauseActionStartedAt;
            if (elapsed < ACTION_LOADING_MIN_DURATION_MS) {
              await sleep(ACTION_LOADING_MIN_DURATION_MS - elapsed);
            }

            setPauseFeedbackState(itemId, "error");
            schedulePauseFeedback(itemId, () => {
              setPauseFeedbackState(itemId, "idle");
            }, ACTION_ERROR_DURATION_MS);
          } finally {
            setBusyItemId(null);
            setIsActionPending(false);
          }
        })();

        return;
      }

      startActionTransition(async () => {
        try {
          await deleteTrackedItemAction(itemId);

          setItemsState((current) => applyItemAction(current, itemAction));
          setLocallyDeletedItemIds((current) => {
            const next = new Set(current);
            next.add(itemId);
            return next;
          });
        } catch (error) {
          setActionError(mapError(error));
          startRefreshTransition(() => {
            router.refresh();
          });
        } finally {
          setBusyItemId(null);
          setIsActionPending(false);
          setPendingDeleteItemId(null);
        }
      });
    },
    [
      clearPauseFeedbackTimer,
      clearResumeFeedbackTimer,
      isMutating,
      router,
      schedulePauseFeedback,
      scheduleResumeFeedback,
      setPauseFeedbackState,
      setResumeFeedbackState,
      startActionTransition,
      startRefreshTransition,
    ]
  );

  const requestDeleteAction = useCallback(
    (itemId: string) => {
      if (isMutating) {
        return;
      }

      setActionError(null);
      setDeleteConfirmItemId(itemId);
    },
    [isMutating]
  );

  const cancelDeleteAction = useCallback(() => {
    if (isActionPending) {
      return;
    }
    setDeleteConfirmItemId(null);
  }, [isActionPending]);

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

    const optimisticItemId = `optimistic-${crypto.randomUUID()}`;
    const optimisticItem: TrackedItemSummary = {
      item_id: optimisticItemId,
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
    setItemsState((current) =>
      applyItemAction(current, {
        type: "add",
        item: optimisticItem,
      })
    );

    setModalError(null);
    setActionError(null);
    closeModal();

    startSaveTransition(async () => {
      try {
        const response = (await createTrackedItemAction({
          url: preview.url,
          sites: preview.site_key ? [preview.site_key] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: trackingMode === "alert" ? targetAmount.trim() : null,
        })) as { item?: unknown };

        const committedItem = toTrackedItemSummary(response.item, optimisticItem);
        setItemsState((current) => {
          const withoutTemporaryOrDuplicate = current.filter(
            (item) =>
              item.item_id !== optimisticItemId && item.item_id !== committedItem.item_id
          );
          return [committedItem, ...withoutTemporaryOrDuplicate];
        });
      } catch (error) {
        setItemsState((current) =>
          current.filter((item) => item.item_id !== optimisticItemId)
        );
        setActionError(mapError(error));
        startRefreshTransition(() => {
          router.refresh();
        });
      }
    });
  }, [
    closeModal,
    interval,
    minInterval,
    preview,
    router,
    startRefreshTransition,
    startSaveTransition,
    targetAmount,
    trackingMode,
  ]);

  return {
    botUsername,
    busyItemId,
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
    maxTrackers,
    me,
    minInterval,
    modalError,
    modalStep,
    pauseFeedbackByItemId,
    pendingDeleteItemId,
    deleteConfirmItem,
    isDeleteConfirmOpen: deleteConfirmItemId !== null,
    preview,
    query,
    resumeFeedbackByItemId,
    summary,
    targetAmount,
    telegramConnected,
    trackingMode,
    urlInput,
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
