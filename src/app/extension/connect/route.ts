import { NextResponse } from "next/server";

import {
  createExtensionAuthCode,
  createExtensionAuthorizeChallenge,
  verifyExtensionAuthorizeChallenge,
} from "@/features/extension/server/auth-code";
import { getAuthContext } from "@/lib/auth-dal";
import { getAccessTokenForFastApi } from "@/lib/server-auth";

export const runtime = "nodejs";

function isAllowedExtensionRedirectUri(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "chrome-extension:" ||
      parsed.protocol === "moz-extension:" ||
      parsed.hostname.endsWith(".chromiumapp.org") ||
      parsed.hostname.endsWith(".extensions.allizom.org")
    );
  } catch {
    return false;
  }
}

function redirectWithParams(redirectUri: string, params: Record<string, string>) {
  const target = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getExtensionLabel(redirectUri: string): string {
  try {
    const parsed = new URL(redirectUri);
    if (parsed.protocol === "chrome-extension:") {
      return "Chrome extension";
    }
    if (parsed.protocol === "moz-extension:") {
      return "Firefox extension";
    }
    return parsed.hostname || "browser extension";
  } catch {
    return "browser extension";
  }
}

function renderAuthorizePage({
  redirectUri,
  state,
  extensionLabel,
  challenge,
}: {
  redirectUri: string;
  state: string;
  extensionLabel: string;
  challenge: string;
}) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Authorize Dealvinci Extension</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: oklch(0.974 0.009 252);
        color: oklch(0.2 0.03 258);
        padding: 24px;
      }
      main {
        width: min(100%, 448px);
        border: 1px solid oklch(0.88 0.018 252);
        border-radius: 20px;
        background: oklch(0.998 0.004 252);
        box-shadow: 0 20px 54px oklch(0.25 0.04 258 / 0.12);
        padding: 24px;
      }
      .eyebrow {
        margin: 0 0 8px;
        color: oklch(0.5 0.035 258);
        font-size: 11px;
        font-weight: 760;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1.18;
        letter-spacing: 0;
      }
      p {
        margin: 12px 0 0;
        color: oklch(0.46 0.035 258);
        font-size: 14px;
        line-height: 1.55;
      }
      .scope {
        margin: 18px 0;
        border: 1px solid oklch(0.88 0.018 252);
        border-radius: 14px;
        background: oklch(0.965 0.01 252);
        padding: 13px;
      }
      .scope ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: grid;
        gap: 8px;
      }
      .scope li {
        color: oklch(0.28 0.035 258);
        font-size: 13px;
        line-height: 1.4;
        display: grid;
        grid-template-columns: 18px 1fr;
        gap: 8px;
      }
      .scope li::before {
        content: "";
        width: 8px;
        height: 8px;
        margin-top: 5px;
        border-radius: 999px;
        background: oklch(0.56 0.19 258);
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      button {
        min-height: 38px;
        border-radius: 10px;
        border: 1px solid oklch(0.56 0.19 258);
        background: oklch(0.56 0.19 258);
        color: oklch(0.985 0.006 252);
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 720;
        padding: 8px 13px;
      }
      button.secondary {
        border-color: oklch(0.84 0.02 252);
        background: transparent;
        color: oklch(0.42 0.035 258);
      }
      .fine {
        margin-top: 14px;
        color: oklch(0.54 0.032 258);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main>
      <p class="eyebrow">Dealvinci</p>
      <h1>Authorize extension</h1>
      <p>Allow the ${escapeHtml(extensionLabel)} to add the product page you choose to your tracker.</p>
      <div class="scope">
        <ul>
          <li>Send the current page URL and title to Dealvinci.</li>
          <li>Apply your tracker type, movement setting, and target price.</li>
          <li>Use a short-lived extension token. Reconnect when it expires.</li>
        </ul>
      </div>
      <form method="post" class="actions">
        <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
        <input type="hidden" name="state" value="${escapeHtml(state)}" />
        <input type="hidden" name="challenge" value="${escapeHtml(challenge)}" />
        <button type="submit" name="decision" value="approve">Authorize</button>
        <button class="secondary" type="submit" name="decision" value="cancel">Cancel</button>
      </form>
      <p class="fine">Disconnect from the extension popup any time.</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "X-Frame-Options": "DENY",
      },
    }
  );
}

async function getSignedInOrRedirect(requestUrl: URL) {
  const auth = await getAuthContext();
  if (auth) {
    return null;
  }

  const next = `${requestUrl.pathname}${requestUrl.search}`;
  const signInUrl = new URL("/auth/sign-in", requestUrl.origin);
  signInUrl.searchParams.set("next", next);
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectUri = requestUrl.searchParams.get("redirect_uri") ?? "";
  const state = requestUrl.searchParams.get("state") ?? "";

  if (!redirectUri || !state || !isAllowedExtensionRedirectUri(redirectUri)) {
    return NextResponse.json({ detail: "Invalid extension redirect." }, { status: 400 });
  }

  const signInRedirect = await getSignedInOrRedirect(requestUrl);
  if (signInRedirect) {
    return signInRedirect;
  }

  return renderAuthorizePage({
    redirectUri,
    state,
    extensionLabel: getExtensionLabel(redirectUri),
    challenge: createExtensionAuthorizeChallenge(redirectUri, state),
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const state = String(formData.get("state") ?? "");
  const challenge = String(formData.get("challenge") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!redirectUri || !state || !isAllowedExtensionRedirectUri(redirectUri)) {
    return NextResponse.json({ detail: "Invalid extension redirect." }, { status: 400 });
  }

  try {
    verifyExtensionAuthorizeChallenge(challenge, redirectUri, state);
  } catch (error) {
    return redirectWithParams(redirectUri, {
      error: "invalid_authorization_request",
      error_description:
        error instanceof Error ? error.message : "Invalid extension authorization request.",
      state,
    });
  }

  const auth = await getAuthContext();
  if (!auth) {
    return redirectWithParams(redirectUri, {
      error: "authentication_required",
      error_description: "Sign in to Dealvinci before authorizing the extension.",
      state,
    });
  }

  if (decision !== "approve") {
    return redirectWithParams(redirectUri, {
      error: "access_denied",
      error_description: "Extension authorization was cancelled.",
      state,
    });
  }

  try {
    const token = await getAccessTokenForFastApi();
    return redirectWithParams(redirectUri, {
      code: createExtensionAuthCode(token, redirectUri),
      state,
    });
  } catch (error) {
    return redirectWithParams(redirectUri, {
      error: "authorization_failed",
      error_description: error instanceof Error ? error.message : "Authorization failed.",
      state,
    });
  }
}
