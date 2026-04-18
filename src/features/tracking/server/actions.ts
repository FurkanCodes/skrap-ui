"use server";

import {
  deleteBackend,
  patchBackendJson,
  postBackendJson,
} from "@/features/scraper/server/backend-client";
import type { TrackedItemRequest, TrackedItemUpdateRequest } from "@/features/tracking/types";

export async function createTrackedItemAction(payload: TrackedItemRequest) {
  return postBackendJson("/api/v1/tracked-items", payload, { auth: true });
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
