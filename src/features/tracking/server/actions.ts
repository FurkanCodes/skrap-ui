"use server";

import {
  deleteBackend,
  getBackendJson,
  patchBackendJson,
  postBackendJson,
} from "@/features/scraper/server/backend-client";

type FetchMode = "auto" | "http" | "dynamic" | "stealth";
type TrackingStatus = "active" | "paused";

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

export interface TrackedItemSummary {
  item_id: string;
  source_url: string;
  product_name: string | null;
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
}

export async function getMeAction(): Promise<MeResponse> {
  return getBackendJson<MeResponse>("/api/v1/me", { auth: true });
}

export async function createTrackedItemAction(payload: TrackedItemRequest) {
  return postBackendJson("/api/v1/tracked-items", payload, { auth: true });
}

export async function listTrackedItemsAction(): Promise<TrackedItemsListResponse> {
  return getBackendJson<TrackedItemsListResponse>("/api/v1/tracked-items", { auth: true });
}

export async function getTrackedItemAction(itemId: string) {
  return getBackendJson(`/api/v1/tracked-items/${itemId}`, { auth: true });
}

export async function patchTrackedItemAction(itemId: string, payload: TrackedItemUpdateRequest) {
  return patchBackendJson(`/api/v1/tracked-items/${itemId}`, payload, { auth: true });
}

export async function pauseTrackedItemAction(itemId: string) {
  return patchTrackedItemAction(itemId, { status: "paused" });
}

export async function resumeTrackedItemAction(itemId: string) {
  return patchTrackedItemAction(itemId, { status: "active" });
}

export async function deleteTrackedItemAction(itemId: string): Promise<void> {
  await deleteBackend(`/api/v1/tracked-items/${itemId}`, { auth: true });
}
