import type { TrackedItemSummary } from "@/features/tracking/types";
import type {
  BulkTrackerDraft,
  ItemMutationAction,
} from "@/features/tracking/components/trackers-dashboard/types";
import { TEST_INTERVAL_15_SECONDS_VALUE } from "@/features/tracking/components/trackers-dashboard/constants";
import { formatCurrencyAmount } from "@/lib/currency";

const OPTIMISTIC_ITEM_ID_PREFIX = "optimistic-";

export function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Request failed.";
}

export function normalizeBotUsername(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@/, "");
}

export function formatInterval(value: number): string {
  if (value === TEST_INTERVAL_15_SECONDS_VALUE) {
    return "every 15s";
  }

  if (value < 60) {
    return `every ${value}m`;
  }

  const hours = value / 60;
  if (Number.isInteger(hours) && hours >= 1) {
    return `every ${hours}h`;
  }

  const days = value / 1440;
  if (Number.isInteger(days)) {
    return `every ${days}d`;
  }
  return `every ${value}m`;
}

export function parseNumberish(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeHttpUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function getSuggestedTargetAmount(value: string | null): string {
  const parsed = parseNumberish(value);
  if (parsed === null || parsed <= 0) {
    return "";
  }

  return (parsed * 0.9).toFixed(2);
}

export function normalizePositiveTargetAmount(value: string): string | null {
  const parsed = parseNumberish(value.trim());
  if (parsed === null || parsed <= 0) {
    return null;
  }

  return String(Number(parsed.toFixed(2)));
}

export function getIntervalValidationError(
  value: string,
  minInterval: number
): string | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minInterval || parsed > 10080) {
    return `Interval must be between ${minInterval} and 10080.`;
  }

  return null;
}

export function formatPrice(value: string | null, currency: string | null): string {
  if (!value) {
    return "Price unavailable";
  }
  return formatCurrencyAmount(value, currency, { fallback: "Price unavailable" });
}

export function formatTargetAmount(value: string | null, currency: string | null): string | null {
  if (!value) {
    return null;
  }
  return formatCurrencyAmount(value, currency, { fallback: value });
}

function formatDeltaAmount(value: number, currency: string | null): string {
  return formatCurrencyAmount(value, currency, {
    fallback: "0",
    maximumFractionDigits: 2,
  });
}

export function getDomainLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
}

export function getRelativeCheckedLabel(updatedAt: string): string {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) {
    return "Checked recently";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "Checked just now";
  }
  if (diffMs < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diffMs / 60_000));
    return `Checked ${minutes}m ago`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.max(1, Math.floor(diffMs / 3_600_000));
    return `Checked ${hours}h ago`;
  }
  const days = Math.max(1, Math.floor(diffMs / 86_400_000));
  return `Checked ${days}d ago`;
}

export function getProgress(
  item: TrackedItemSummary
): { percent: number | null; label: string; compactLabel: string } {
  const current = parseNumberish(item.last_amount);
  const target = parseNumberish(item.target_amount);

  if (current === null || target === null || target <= 0) {
    return {
      percent: null,
      label: formatInterval(item.check_interval_minutes),
      compactLabel: formatInterval(item.check_interval_minutes),
    };
  }

  if (current <= target) {
    const gap = target - current;
    return {
      percent: 100,
      label: gap < 0.01 ? "At target" : `${formatDeltaAmount(gap, item.currency)} below target`,
      compactLabel: gap < 0.01 ? "At target" : "Below target",
    };
  }

  const gap = current - target;
  const percent = Math.max(4, Math.min(100, (target / current) * 100));
  return {
    percent,
    label: `${formatDeltaAmount(gap, item.currency)} above target`,
    compactLabel: "Above target",
  };
}

function toOptionalString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

export function toTrackedItemSummary(
  raw: unknown,
  fallback: TrackedItemSummary
): TrackedItemSummary {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const record = raw as Record<string, unknown>;
  const status =
    record.status === "paused" || record.status === "active"
      ? record.status
      : fallback.status;
  const trackingMode =
    record.tracking_mode === "monitor" || record.tracking_mode === "alert"
      ? record.tracking_mode
      : fallback.tracking_mode;
  const interval =
    typeof record.check_interval_minutes === "number" &&
    Number.isInteger(record.check_interval_minutes) &&
    record.check_interval_minutes > 0
      ? record.check_interval_minutes
      : fallback.check_interval_minutes;

  return {
    item_id: toOptionalString(record.item_id) ?? fallback.item_id,
    source_url:
      toOptionalString(record.source_url) ??
      toOptionalString(record.url) ??
      fallback.source_url,
    product_name:
      record.product_name === null
        ? null
        : (toOptionalString(record.product_name) ?? fallback.product_name),
    image_url:
      record.image_url === null
        ? null
        : (toOptionalString(record.image_url) ?? fallback.image_url),
    status,
    tracking_mode: trackingMode,
    check_interval_minutes: interval,
    target_amount:
      record.target_amount === null
        ? null
        : (toOptionalString(record.target_amount) ?? fallback.target_amount),
    last_amount:
      record.last_amount === null
        ? null
        : (toOptionalString(record.last_amount) ?? fallback.last_amount),
    currency:
      record.currency === null
        ? null
        : (toOptionalString(record.currency) ?? fallback.currency),
    next_check_at:
      record.next_check_at === null
        ? null
        : (toOptionalString(record.next_check_at) ?? fallback.next_check_at),
    updated_at: toOptionalString(record.updated_at) ?? fallback.updated_at,
  };
}

export function applyItemAction(
  current: TrackedItemSummary[],
  action: ItemMutationAction
): TrackedItemSummary[] {
  if (action.type === "add") {
    return [action.item, ...current];
  }

  if (action.type === "delete") {
    return current.filter((item) => item.item_id !== action.itemId);
  }

  const nextStatus = action.type === "pause" ? "paused" : "active";
  return current.map((item) =>
    item.item_id === action.itemId ? { ...item, status: nextStatus } : item
  );
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getUpdatedAtMs(item: TrackedItemSummary): number {
  const parsed = Date.parse(item.updated_at);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isOptimisticItemId(itemId: string): boolean {
  return itemId.startsWith(OPTIMISTIC_ITEM_ID_PREFIX);
}

function normalizeAmountForMatch(value: string | null): number | null {
  const parsed = parseNumberish(value);
  if (parsed === null) {
    return null;
  }

  return Number(parsed.toFixed(4));
}

function hasSameTargetAmount(
  left: TrackedItemSummary,
  right: TrackedItemSummary
): boolean {
  return normalizeAmountForMatch(left.target_amount) === normalizeAmountForMatch(right.target_amount);
}

function isLikelySameTracker(
  optimisticItem: TrackedItemSummary,
  candidate: TrackedItemSummary
): boolean {
  return (
    optimisticItem.source_url === candidate.source_url &&
    optimisticItem.tracking_mode === candidate.tracking_mode &&
    optimisticItem.check_interval_minutes === candidate.check_interval_minutes &&
    hasSameTargetAmount(optimisticItem, candidate)
  );
}

function findIncomingMatchForOptimisticItem(
  optimisticItem: TrackedItemSummary,
  incomingById: Map<string, TrackedItemSummary>
): [string, TrackedItemSummary] | null {
  for (const [candidateId, candidate] of incomingById.entries()) {
    if (isOptimisticItemId(candidateId)) {
      continue;
    }

    if (isLikelySameTracker(optimisticItem, candidate)) {
      return [candidateId, candidate];
    }
  }

  return null;
}

function extractTrackedItemPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  const record = raw as Record<string, unknown>;
  return record.item ?? raw;
}

export function mergePatchedItem(
  current: TrackedItemSummary[],
  itemId: string,
  patchResult: unknown,
  fallbackStatus: "active" | "paused"
): TrackedItemSummary[] {
  return current.map((item) => {
    if (item.item_id !== itemId) {
      return item;
    }

    const fallbackItem: TrackedItemSummary = {
      ...item,
      status: fallbackStatus,
      updated_at: new Date().toISOString(),
    };

    return toTrackedItemSummary(extractTrackedItemPayload(patchResult), fallbackItem);
  });
}

export function getInitialBulkDraftId(drafts: BulkTrackerDraft[]): string | null {
  const selectedReadyDraft = drafts.find(
    (draft) => draft.previewStatus === "ready" && draft.selected
  );
  if (selectedReadyDraft) {
    return selectedReadyDraft.clientId;
  }

  const failedDraft = drafts.find((draft) => draft.previewStatus === "failed");
  if (failedDraft) {
    return failedDraft.clientId;
  }

  return drafts[0]?.clientId ?? null;
}

export function syncBulkDraftSelectionLimits(
  drafts: BulkTrackerDraft[],
  remainingSlots: number
): BulkTrackerDraft[] {
  const selectedReadyCount = drafts.filter(
    (draft) => draft.previewStatus === "ready" && draft.selected
  ).length;

  return drafts.map((draft) => {
    if (draft.previewStatus !== "ready") {
      return draft.overLimit ? { ...draft, overLimit: false } : draft;
    }

    const overLimit = !draft.selected && selectedReadyCount >= remainingSlots;
    return draft.overLimit === overLimit ? draft : { ...draft, overLimit };
  });
}

export function reconcileItemsPreservingOrder(
  current: TrackedItemSummary[],
  incoming: TrackedItemSummary[],
  locallyDeletedItemIds: ReadonlySet<string>
): TrackedItemSummary[] {
  const incomingById = new Map(
    incoming
      .filter((item) => !locallyDeletedItemIds.has(item.item_id))
      .map((item) => [item.item_id, item])
  );
  const next: TrackedItemSummary[] = [];

  for (const existing of current) {
    if (locallyDeletedItemIds.has(existing.item_id)) {
      continue;
    }

    const replacement = incomingById.get(existing.item_id);
    if (replacement) {
      const nextItem =
        getUpdatedAtMs(replacement) > getUpdatedAtMs(existing) ? replacement : existing;
      next.push(nextItem);
      incomingById.delete(existing.item_id);
      continue;
    }

    if (isOptimisticItemId(existing.item_id)) {
      const optimisticMatch = findIncomingMatchForOptimisticItem(existing, incomingById);
      if (optimisticMatch) {
        next.push(optimisticMatch[1]);
        incomingById.delete(optimisticMatch[0]);
        continue;
      }
    }

    next.push(existing);
  }

  for (const incomingItem of incoming) {
    if (incomingById.has(incomingItem.item_id)) {
      next.push(incomingItem);
      incomingById.delete(incomingItem.item_id);
    }
  }

  return next;
}
