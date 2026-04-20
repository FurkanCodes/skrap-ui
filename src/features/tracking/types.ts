export type FetchMode = "auto" | "http" | "dynamic" | "stealth";
export type TrackingStatus = "active" | "paused";

export interface TrackedItemRequest {
  url: string;
  sites?: string[];
  timeout_seconds?: number;
  fetch_mode?: FetchMode;
  check_interval_minutes?: number;
  target_amount?: string | null;
}

export interface TrackedItemUpdateRequest {
  status?: TrackingStatus;
  check_interval_minutes?: number;
  target_amount?: string | null;
}

export interface TrackedItemPreview {
  url: string;
  site_key: string | null;
  product_name: string;
  amount: string | null;
  currency: string | null;
  image_url: string | null;
}

export interface TrackedItemSummary {
  item_id: string;
  source_url: string;
  product_name: string | null;
  image_url: string | null;
  status: TrackingStatus;
  tracking_mode: "monitor" | "alert";
  check_interval_minutes: number;
  target_amount: string | null;
  last_amount: string | null;
  currency: string | null;
  next_check_at: string | null;
  updated_at: string;
}

export interface TrackedItemsListResponse {
  items: TrackedItemSummary[];
}

export interface MeResponse {
  user: {
    user_id: string;
    auth_provider: string;
    auth_subject: string;
    email: string | null;
    display_name: string | null;
    created_at: string;
    updated_at: string;
  };
  entitlement: {
    user_id: string;
    plan_key: string;
    max_active_trackers: number;
    min_check_interval_minutes: number;
    monthly_check_units: number;
    allowed_channels: string;
    overage_policy: string;
    created_at: string;
    updated_at: string;
  };
  usage: {
    user_id: string;
    period_start: string;
    period_end: string;
    monthly_check_units: number;
    consumed_check_units: number;
    remaining_check_units: number;
    updated_at: string;
  };
}
