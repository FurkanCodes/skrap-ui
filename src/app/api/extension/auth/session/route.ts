import {
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";

export const runtime = "nodejs";

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function DELETE(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return extensionJson({ detail: "Missing extension token." }, { status: 401 });
  }

  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
