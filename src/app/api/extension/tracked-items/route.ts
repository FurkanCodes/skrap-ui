import {
  extensionErrorResponse,
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";
import {
  getExtensionBackendJson,
  postExtensionBackendJson,
} from "@/features/extension/server/backend";
import { verifyExtensionSessionToken } from "@/features/extension/server/auth-code";
import { BackendApiError } from "@/features/scraper/server/backend-client";

export const runtime = "nodejs";

interface ExtensionTrackedItemBody {
  url?: string;
  title?: string | null;
  type?: "monitor" | "alert";
  direction?: "drop" | "drop-increase";
  target_amount?: string | null;
}

interface ExtensionDuplicateItem {
  item_id: string;
  source_url: string;
  product_name: string | null;
  status: "active" | "paused";
  created_via: "dashboard" | "extension" | null;
}

interface TrackedItemLookupResponse {
  item?: unknown;
}

function normalizeUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function getBearerToken(authorization: string | null): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }
  return authorization.slice("Bearer ".length).trim() || null;
}

function toDuplicateItem(value: unknown): ExtensionDuplicateItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const itemId = typeof record.item_id === "string" ? record.item_id : "";
  const sourceUrl = typeof record.source_url === "string" ? record.source_url : "";
  const status = record.status === "paused" ? "paused" : "active";
  if (!itemId || !sourceUrl) {
    return null;
  }

  return {
    item_id: itemId,
    source_url: sourceUrl,
    product_name:
      typeof record.product_name === "string" ? record.product_name : null,
    status,
    created_via:
      record.created_via === "dashboard" || record.created_via === "extension"
        ? record.created_via
        : null,
  };
}

function getDuplicateFromBackendError(error: BackendApiError): ExtensionDuplicateItem | null {
  if (!error.detail || typeof error.detail !== "object") {
    return null;
  }

  return toDuplicateItem((error.detail as { item?: unknown }).item);
}

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function GET(request: Request) {
  const extensionToken = getBearerToken(request.headers.get("authorization"));
  if (!extensionToken) {
    return extensionJson({ detail: "Missing extension token." }, { status: 401 });
  }

  let upstreamAccessToken: string;
  try {
    upstreamAccessToken = verifyExtensionSessionToken(extensionToken).accessToken;
  } catch {
    return extensionJson({ detail: "Session expired. Connect Dealvinci again." }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const normalizedUrl = normalizeUrl(requestUrl.searchParams.get("url") ?? undefined);
  if (!normalizedUrl) {
    return extensionJson({ detail: "Enter a valid http/https product URL." }, { status: 400 });
  }

  try {
    const result = await getExtensionBackendJson<TrackedItemLookupResponse>(
      `/api/v1/tracked-items/lookup?url=${encodeURIComponent(normalizedUrl)}`,
      { authorization: `Bearer ${upstreamAccessToken}` }
    );
    return extensionJson({ duplicate: toDuplicateItem(result.item) });
  } catch (error) {
    return extensionErrorResponse(error, "Could not check tracker.");
  }
}

export async function POST(request: Request) {
  const extensionToken = getBearerToken(request.headers.get("authorization"));
  if (!extensionToken) {
    return extensionJson({ detail: "Missing extension token." }, { status: 401 });
  }

  let upstreamAccessToken: string;
  try {
    upstreamAccessToken = verifyExtensionSessionToken(extensionToken).accessToken;
  } catch {
    return extensionJson({ detail: "Session expired. Connect Dealvinci again." }, { status: 401 });
  }

  let body: ExtensionTrackedItemBody;
  try {
    body = (await request.json()) as ExtensionTrackedItemBody;
  } catch {
    return extensionJson({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  const normalizedUrl = normalizeUrl(body.url);
  if (!normalizedUrl) {
    return extensionJson({ detail: "Enter a valid http/https product URL." }, { status: 400 });
  }

  if (body.type !== "monitor" && body.type !== "alert") {
    return extensionJson({ detail: "Choose a tracker type." }, { status: 400 });
  }

  const targetAmount = body.type === "alert" ? (body.target_amount ?? null) : null;
  if (body.type === "alert" && !targetAmount?.trim()) {
    return extensionJson(
      { detail: "Target price is required for Price Alert." },
      { status: 400 }
    );
  }

  try {
    const result = await postExtensionBackendJson(
      "/api/v1/tracked-items",
      {
        url: normalizedUrl,
        target_amount: targetAmount,
        notify_on_price_increase: body.direction === "drop-increase",
        fetch_mode: "auto",
        duplicate_policy: "reject",
        created_via: "extension",
      },
      { authorization: `Bearer ${upstreamAccessToken}` }
    );
    return extensionJson(result, { status: 201 });
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 409) {
      return extensionJson(
        {
          detail: error.message || "Already tracking this product.",
          duplicate: getDuplicateFromBackendError(error),
        },
        { status: 409 }
      );
    }
    return extensionErrorResponse(error, "Could not add tracker.");
  }
}
