import type {
  ModeFilterOption,
  StatusFilterOption,
} from "@/features/tracking/components/trackers-dashboard/types";

export const TEST_INTERVAL_15_SECONDS_VALUE = 10_079;

export const STATUS_FILTERS: StatusFilterOption[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
];

export const MODE_FILTERS: ModeFilterOption[] = [
  { key: "all", label: "All" },
  { key: "alert", label: "Price Alert" },
  { key: "monitor", label: "Monitor" },
];

export const INTERVAL_OPTIONS: Array<{ label: string; value: number }> = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "3 hours", value: 180 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "24 hours", value: 1440 },
  { label: "15 sec (test)", value: TEST_INTERVAL_15_SECONDS_VALUE },
];

export const ACTION_LOADING_MIN_DURATION_MS = 350;
export const ACTION_SUCCESS_DURATION_MS = 2200;
export const ACTION_ERROR_DURATION_MS = 1200;
