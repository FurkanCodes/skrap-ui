import {
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";
import { verifyExtensionSessionToken } from "@/features/extension/server/auth-code";

export const runtime = "nodejs";

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return extensionJson({ detail: "Missing extension token." }, { status: 401 });
  }

  try {
    verifyExtensionSessionToken(token);
  } catch {
    return extensionJson({ detail: "Session expired. Connect Dealvinci again." }, { status: 401 });
  }

  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
