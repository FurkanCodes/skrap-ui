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

export interface StatusFilterOption {
  key: StatusFilterKey;
  label: string;
}

export interface ModeFilterOption {
  key: ModeFilterKey;
  label: string;
}
