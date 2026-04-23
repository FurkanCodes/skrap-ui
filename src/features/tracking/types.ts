export type FetchMode = "auto" | "http" | "dynamic" | "stealth";
export type TrackingStatus = "active" | "paused";

export interface TrackedItemRequest {
  url: string;
  sites?: string[];
  timeout_seconds?: number;
  fetch_mode?: FetchMode;
  check_interval_minutes?: number;
  target_amount?: string | null;
  notify_on_price_increase?: boolean;
}

export interface TrackedItemBulkRequestItem {
  url?: string | null;
  scrape_result_ref?: string | null;
  check_interval_minutes?: number | null;
  target_amount?: string | null;
  notify_on_price_increase?: boolean | null;
}

export interface TrackedItemBulkRequest {
  items?: TrackedItemBulkRequestItem[] | null;
  urls?: string[] | null;
  sites?: string[];
  timeout_seconds?: number;
  fetch_mode?: FetchMode;
  check_interval_minutes?: number;
  target_amount?: string | null;
  notify_on_price_increase?: boolean;
}

export interface TrackedItemUpdateRequest {
  status?: TrackingStatus;
  check_interval_minutes?: number;
  target_amount?: string | null;
  notify_on_price_increase?: boolean;
}

export interface TrackedItemPreview {
  url: string;
  site_key: string | null;
  product_name: string;
  amount: string | null;
  currency: string | null;
  image_url: string | null;
}

export interface TrackedItemBatchPreviewResult {
  url: string;
  success: boolean;
  site_key: string | null;
  product_name: string | null;
  amount: string | null;
  currency: string | null;
  image_url: string | null;
  error: string | null;
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
  notify_on_price_increase: boolean;
  last_amount: string | null;
  currency: string | null;
  next_check_at: string | null;
  updated_at: string;
}

export interface TrackedItemsListResponse {
  items: TrackedItemSummary[];
}

export interface TrackedItemBulkBootstrapResult {
  index: number;
  url: string | null;
  success: boolean;
  item?: unknown | null;
  error?: string | null;
}

export interface TrackedItemBulkBootstrapResponse {
  request_id: string;
  total_items: number;
  success_count: number;
  failure_count: number;
  results: TrackedItemBulkBootstrapResult[];
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
