import type { FilterOption } from "@/features/tracking/components/trackers-dashboard/types";

export const FILTERS: FilterOption[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "alert", label: "Price Alert" },
  { key: "monitor", label: "Monitor" },
];

export const INTERVAL_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "15 sec", value: 15 },
  { label: "30 sec", value: 30 },
  { label: "45 sec", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "3 hours", value: 180 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "24 hours", value: 1440 },
];

export const ACTION_LOADING_MIN_DURATION_MS = 350;
export const ACTION_SUCCESS_DURATION_MS = 2200;
export const ACTION_ERROR_DURATION_MS = 1200;
