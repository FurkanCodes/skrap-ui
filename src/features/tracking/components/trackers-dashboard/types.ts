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

export type FilterKey = "all" | "active" | "paused" | "alert" | "monitor";
export type TrackingMode = "alert" | "monitor";
export type ActionFeedbackState = "idle" | "loading" | "success" | "error";

export interface FilterOption {
  key: FilterKey;
  label: string;
}
