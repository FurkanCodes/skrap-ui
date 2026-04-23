import type { TrackedItemSummary } from "@/features/tracking/types";

export interface TrackersDashboardClientProps {
  isAuthenticated: boolean;
  initialItems: TrackedItemSummary[];
  initialError: string | null;
  telegramConnected: boolean | null;
  telegramBotUsername: string | null;
}

export type ItemAction = "pause" | "resume" | "delete";

export type ItemMutationAction =
  | {
      type: ItemAction;
      itemId: string;
    }
  | {
      type: "add";
      item: TrackedItemSummary;
    };

export type StatusFilterKey = "all" | "active" | "paused";
export type ModeFilterKey = "all" | "alert" | "monitor";
export type TrackingMode = "alert" | "monitor";
export type ActionFeedbackState = "idle" | "loading" | "success" | "error";
export type BulkTrackerDraftStatus = "ready" | "failed";

export interface StatusFilterOption {
  key: StatusFilterKey;
  label: string;
}

export interface ModeFilterOption {
  key: ModeFilterKey;
  label: string;
}

export interface TrackerUrlInputRow {
  id: string;
  value: string;
}

export interface BulkTrackerDraft {
  clientId: string;
  sourceRowId: string | null;
  rawUrl: string;
  normalizedUrl: string;
  previewStatus: BulkTrackerDraftStatus;
  selected: boolean;
  overLimit: boolean;
  previewError: string | null;
  submitError: string | null;
  productName: string | null;
  imageUrl: string | null;
  amount: string | null;
  currency: string | null;
  siteKey: string | null;
  trackingMode: TrackingMode;
  interval: string;
  targetAmount: string;
  notifyOnPriceIncrease: boolean;
  modeOverridden: boolean;
  intervalOverridden: boolean;
  notifyOnPriceIncreaseOverridden: boolean;
}
