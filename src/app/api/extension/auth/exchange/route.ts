import {
  extensionErrorResponse,
  extensionJson,
  extensionOptionsResponse,
} from "@/features/extension/server/responses";
import {
  createExtensionSessionToken,
  exchangeExtensionAuthCode,
} from "@/features/extension/server/auth-code";

export const runtime = "nodejs";

interface ExchangeBody {
  code?: string;
  redirect_uri?: string;
}

export function OPTIONS() {
  return extensionOptionsResponse();
}

export async function POST(request: Request) {
  let body: ExchangeBody;
  try {
    body = (await request.json()) as ExchangeBody;
  } catch {
    return extensionJson({ detail: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body.code || !body.redirect_uri) {
    return extensionJson({ detail: "Missing extension auth code." }, { status: 400 });
  }

  try {
    const result = exchangeExtensionAuthCode(body.code, body.redirect_uri);
    const session = createExtensionSessionToken(result.accessToken, body.redirect_uri);
    return extensionJson({
      access_token: session.token,
      expires_at: new Date(session.expiresAt).toISOString(),
    });
  } catch (error) {
    if (error instanceof Error) {
      return extensionJson({ detail: error.message }, { status: 400 });
    }
    return extensionErrorResponse(error, "Could not exchange extension auth code.");
  }
}
