import {
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";

export const runtime = "nodejs";

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    return extensionJson({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  return extensionJson(
    { detail: "Extension session expired. Reconnect Dealvinci." },
    { status: 401 }
  );
}
