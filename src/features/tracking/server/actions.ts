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
import {
  getTrackIntervalValidationError,
  resolveEffectiveMinIntervalMinutes,
} from "@/features/tracking/interval-policy";
import { getTrackedItemsTag } from "@/features/tracking/server/cache-tags";
import { getMeQuery } from "@/features/tracking/server/queries";
import type {
  TrackedItemBatchPreviewResult,
  TrackedItemBulkBootstrapResponse,
  TrackedItemBulkRequest,
  TrackedItemPreview,
  TrackedItemRequest,
  TrackedItemUpdateRequest,
} from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";
import { requireSession, requireUserId, UnauthenticatedError } from "@/lib/server-auth";

async function getTrackedItemsTagForCurrentSession(): Promise<string | null> {
  const userId = await requireUserId();
  return getTrackedItemsTag(userId);
}

function revalidateTrackedItems(tag: string | null): void {
  if (tag) {
    updateTag(tag);
  }
}

async function getMinIntervalForCurrentSession(): Promise<number> {
  const authContext = await getAuthContext();
  if (!authContext) {
    throw new UnauthenticatedError();
  }

  const me = await getMeQuery({ cacheKey: authContext.meCacheKey });
  return resolveEffectiveMinIntervalMinutes({
    planKey: me.entitlement.plan_key,
    entitlementMinIntervalMinutes: me.entitlement.min_check_interval_minutes,
  });
}

function validateTrackIntervalOrThrow(
  intervalMinutes: unknown,
  minIntervalMinutes: number,
  label: string
): void {
  if (intervalMinutes === null || intervalMinutes === undefined) {
    return;
  }

  const parsedIntervalMinutes = Number(intervalMinutes);
  const validationError = getTrackIntervalValidationError(
    parsedIntervalMinutes,
    minIntervalMinutes
  );
  if (validationError) {
    throw new Error(`${label}: ${validationError}`);
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

function toTrackedItemBatchPreviewResult(
  normalizedUrl: string,
  result: ScrapesResponse["results"][number] | undefined
): TrackedItemBatchPreviewResult {
  if (!result) {
    return {
      url: normalizedUrl,
      success: false,
      site_key: null,
      product_name: null,
      amount: null,
      currency: null,
      image_url: null,
      error: "No product result returned. Try a different URL.",
    };
  }

  if (!result.success) {
    return {
      url: normalizedUrl,
      success: false,
      site_key: result.site_key ?? result.adapter_key ?? null,
      product_name: null,
      amount: result.amount,
      currency: result.currency,
      image_url: pickImageUrl(result),
      error: result.error ?? "Could not fetch product info. Try another URL.",
    };
  }

  return {
    url: normalizedUrl,
    success: true,
    site_key: result.site_key ?? result.adapter_key ?? null,
    product_name: deriveProductName(normalizedUrl, pickStringValue(result, METADATA_KEYS)),
    amount: result.amount,
    currency: result.currency,
    image_url: pickImageUrl(result),
    error: null,
  };
}

export async function previewTrackedItemsAction(
  rawUrls: string[]
): Promise<TrackedItemBatchPreviewResult[]> {
  await requireSession();
  const normalizedUrls = rawUrls.map((rawUrl) => normalizeProductUrl(rawUrl));
  if (normalizedUrls.length === 0) {
    throw new Error("Add at least one product URL.");
  }

  const payload: ScrapesRequest = {
    urls: normalizedUrls,
    fetch_mode: "auto",
  };
  const response = await postBackendJson<ScrapesResponse, ScrapesRequest>("/api/v1/scrapes", payload, {
    auth: true,
  });

  return normalizedUrls.map((normalizedUrl, index) =>
    toTrackedItemBatchPreviewResult(normalizedUrl, response.results[index])
  );
}

export async function previewTrackedItemAction(rawUrl: string): Promise<TrackedItemPreview> {
  const [firstResult] = await previewTrackedItemsAction([rawUrl]);

  if (!firstResult || !firstResult.success) {
    throw new Error(firstResult.error ?? "Could not fetch product info. Try another URL.");
  }

  return {
    url: firstResult.url,
    site_key: firstResult.site_key,
    amount: firstResult.amount,
    currency: firstResult.currency,
    image_url: firstResult.image_url,
    product_name: firstResult.product_name ?? deriveProductName(firstResult.url, null),
  };
}

export async function createTrackedItemAction(payload: TrackedItemRequest) {
  const minIntervalMinutes = await getMinIntervalForCurrentSession();
  validateTrackIntervalOrThrow(
    payload.check_interval_minutes,
    minIntervalMinutes,
    "Check interval"
  );

  const tag = await getTrackedItemsTagForCurrentSession();
  const result = await postBackendJson("/api/v1/tracked-items", payload, { auth: true });
  revalidateTrackedItems(tag);
  return result;
}

export async function createTrackedItemsBulkAction(
  payload: TrackedItemBulkRequest
): Promise<TrackedItemBulkBootstrapResponse> {
  const minIntervalMinutes = await getMinIntervalForCurrentSession();
  validateTrackIntervalOrThrow(
    payload.check_interval_minutes,
    minIntervalMinutes,
    "Default check interval"
  );
  payload.items?.forEach((item, index) => {
    validateTrackIntervalOrThrow(
      item.check_interval_minutes,
      minIntervalMinutes,
      `Item ${index + 1} check interval`
    );
  });

  const tag = await getTrackedItemsTagForCurrentSession();
  const result = await postBackendJson<TrackedItemBulkBootstrapResponse, TrackedItemBulkRequest>(
    "/api/v1/tracked-items/bulk",
    payload,
    { auth: true }
  );
  revalidateTrackedItems(tag);
  return result;
}

export async function patchTrackedItemAction(itemId: string, payload: TrackedItemUpdateRequest) {
  const minIntervalMinutes = await getMinIntervalForCurrentSession();
  validateTrackIntervalOrThrow(
    payload.check_interval_minutes,
    minIntervalMinutes,
    "Check interval"
  );

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
