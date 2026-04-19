"use server";

import { updateTag } from "next/cache";

import {
  deleteBackend,
  patchBackendJson,
  postBackendJson,
} from "@/features/scraper/server/backend-client";
import { METADATA_KEYS } from "@/features/scraper/constants";
import type { ScrapesRequest, ScrapesResponse } from "@/features/scraper/types";
import { pickImageUrl, pickStringValue } from "@/features/scraper/utils";
import { getTrackedItemsTag } from "@/features/tracking/server/cache-tags";
import type {
  TrackedItemPreview,
  TrackedItemRequest,
  TrackedItemUpdateRequest,
} from "@/features/tracking/types";
import { requireSession, requireUserId } from "@/lib/server-auth";

async function getTrackedItemsTagForCurrentSession(): Promise<string | null> {
  const userId = await requireUserId();
  return getTrackedItemsTag(userId);
}

function revalidateTrackedItems(tag: string | null): void {
  if (tag) {
    updateTag(tag);
  }
}

function normalizeProductUrl(rawUrl: string): string {
  const nextValue = rawUrl.trim();
  if (!nextValue) {
    throw new Error("Product URL is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(nextValue);
  } catch {
    throw new Error("Enter a valid product URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }

  return parsed.toString();
}

function deriveProductName(url: string, fallback: string | null): string {
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    return host || "Tracked product";
  } catch {
    return "Tracked product";
  }
}

export async function previewTrackedItemAction(rawUrl: string): Promise<TrackedItemPreview> {
  await requireSession();
  const normalizedUrl = normalizeProductUrl(rawUrl);

  const payload: ScrapesRequest = {
    urls: [normalizedUrl],
    fetch_mode: "auto",
  };
  const response = await postBackendJson<ScrapesResponse, ScrapesRequest>("/api/v1/scrapes", payload, {
    auth: true,
  });
  const firstResult = response.results[0];

  if (!firstResult) {
    throw new Error("No product result returned. Try a different URL.");
  }

  if (!firstResult.success) {
    throw new Error(firstResult.error ?? "Could not fetch product info. Try another URL.");
  }

  return {
    url: normalizedUrl,
    site_key: firstResult.site_key ?? firstResult.adapter_key ?? null,
    product_name: deriveProductName(normalizedUrl, pickStringValue(firstResult, METADATA_KEYS)),
    amount: firstResult.amount,
    currency: firstResult.currency,
    image_url: pickImageUrl(firstResult),
  };
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
