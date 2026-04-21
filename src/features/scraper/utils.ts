import type { DiscoverResponse, PriceResultResponse, ScrapesResponse } from "@/features/scraper/types";
import { formatCurrencyAmount } from "@/lib/currency";

const IMAGE_CANDIDATE_KEYS = [
  "image",
  "image_url",
  "imageUrl",
  "thumbnail",
  "thumbnail_url",
  "thumbnailUrl",
  "photo",
  "photo_url",
  "photoUrl",
  "cover",
  "cover_image",
  "coverImage",
  "avatar",
  "picture",
  "images",
  "image_urls",
] as const;

const NESTED_IMAGE_KEYS = [
  "url",
  "src",
  "image",
  "image_url",
  "thumbnail",
  "thumbnail_url",
] as const;

export function splitByWhitespace(input: string): string[] {
  return input
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const URL_MATCH_REGEX = /https?:\/\/[^\s<>"']+/gi;
const URL_SPLIT_REGEX = /(?=https?:\/\/)/gi;

function normalizeUrlToken(value: string): string {
  return value
    .trim()
    .replace(/^[([{'"`]+/, "")
    .replace(/[)\]}'"`.,;:!?]+$/, "");
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractUrls(input: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];
  const matches = input.match(URL_MATCH_REGEX) ?? [];

  for (const match of matches) {
    const segments = match.split(URL_SPLIT_REGEX).filter(Boolean);

    for (const segment of segments) {
      const candidate = normalizeUrlToken(segment);
      if (!isHttpUrl(candidate) || seen.has(candidate)) {
        continue;
      }

      seen.add(candidate);
      urls.push(candidate);
    }
  }

  return urls;
}

export function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return undefined;
}

export function isDiscoverResponse(
  response: ScrapesResponse | DiscoverResponse
): response is DiscoverResponse {
  return "discovered_url_count" in response;
}

export function pickStringValue(
  result: PriceResultResponse,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = result[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

export function formatPrice(result: PriceResultResponse): string {
  return formatCurrencyAmount(result.amount, result.currency, {
    fallback: "Price unavailable",
  });
}

function pickImageFromUnknown(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isHttpUrl(trimmed) ? trimmed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickImageFromUnknown(item);
      if (picked) {
        return picked;
      }
    }

    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of NESTED_IMAGE_KEYS) {
      const picked = pickImageFromUnknown(record[key]);
      if (picked) {
        return picked;
      }
    }

    for (const [key, nested] of Object.entries(record)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes("image") || normalizedKey.includes("thumb")) {
        const picked = pickImageFromUnknown(nested);
        if (picked) {
          return picked;
        }
      }
    }
  }

  return null;
}

export function pickImageUrl(result: PriceResultResponse): string | null {
  for (const key of IMAGE_CANDIDATE_KEYS) {
    const picked = pickImageFromUnknown(result[key]);
    if (picked) {
      return picked;
    }
  }

  return null;
}
