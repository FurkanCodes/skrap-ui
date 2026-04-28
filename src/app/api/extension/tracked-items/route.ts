import {
  extensionErrorResponse,
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";
import { postExtensionBackendJson } from "@/features/extension/server/backend";

export const runtime = "nodejs";

interface ExtensionTrackedItemBody {
  url?: string;
  title?: string | null;
  type?: "monitor" | "alert";
  direction?: "drop" | "drop-increase";
  target_amount?: string | null;
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

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return extensionJson({ detail: "Missing extension token." }, { status: 401 });
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
      },
      { authorization }
    );
    return extensionJson(result, { status: 201 });
  } catch (error) {
    return extensionErrorResponse(error, "Could not add tracker.");
  }
}
