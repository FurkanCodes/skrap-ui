import type { DiscoverResponse, PriceResultResponse, ScrapesResponse } from "@/features/scraper/types";

export function splitByWhitespace(input: string): string[] {
  return input
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
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
  if (result.amount && result.currency) {
    return `${result.amount} ${result.currency}`;
  }

  if (result.amount) {
    return result.amount;
  }

  return "Price unavailable";
}
