"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  deleteBackend,
  patchBackendJson,
  postBackendJson,
} from "@/features/scraper/server/backend-client";
import { getTrackedItemsTag } from "@/features/tracking/server/cache-tags";
import type { TrackedItemRequest, TrackedItemUpdateRequest } from "@/features/tracking/types";
import { requireSession } from "@/lib/server-auth";

function getSessionUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  return null;
}

async function getTrackedItemsTagForCurrentSession(): Promise<string | null> {
  const session = await requireSession();
  const userId = getSessionUserId(session);
  if (!userId) {
    return null;
  }
  return getTrackedItemsTag(userId);
}

function revalidateTrackedItems(tag: string | null): void {
  if (tag) {
    revalidateTag(tag, "max");
  }
  revalidatePath("/", "page");
}

export async function createTrackedItemAction(payload: TrackedItemRequest) {
  const tag = await getTrackedItemsTagForCurrentSession();
  const result = await postBackendJson("/api/v1/tracked-items", payload, { auth: true });
  revalidateTrackedItems(tag);
  return result;
}

export async function patchTrackedItemAction(itemId: string, payload: TrackedItemUpdateRequest) {
  const tag = await getTrackedItemsTagForCurrentSession();
  const result = await patchBackendJson(`/api/v1/tracked-items/${itemId}`, payload, { auth: true });
  revalidateTrackedItems(tag);
  return result;
}

export async function pauseTrackedItemAction(itemId: string) {
  return patchTrackedItemAction(itemId, { status: "paused" });
}

export async function resumeTrackedItemAction(itemId: string) {
  return patchTrackedItemAction(itemId, { status: "active" });
}

export async function deleteTrackedItemAction(itemId: string): Promise<void> {
  const tag = await getTrackedItemsTagForCurrentSession();
  await deleteBackend(`/api/v1/tracked-items/${itemId}`, { auth: true });
  revalidateTrackedItems(tag);
}
