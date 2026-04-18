import "server-only";

import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";

export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export async function requireSession() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({
    headers: incomingHeaders,
  });
  if (!session) {
    throw new UnauthenticatedError();
  }
  return session;
}

export async function getAccessTokenForFastApi(): Promise<string> {
  const auth = getAuth();
  await requireSession();

  // Prefer the typed Better Auth API function when available.
  const maybeApi = auth.api as unknown as {
    token?: (input: { headers: Headers }) => Promise<{ token?: string } | null>;
  };

  const incomingHeaders = await headers();
  if (typeof maybeApi.token === "function") {
    const tokenResponse = await maybeApi.token({ headers: incomingHeaders });
    const token = tokenResponse?.token?.trim();
    if (token) {
      return token;
    }
  }

  // Fallback to REST endpoint for JWT plugin compatibility.
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) {
    throw new Error("BETTER_AUTH_URL is required");
  }
  const cookieHeader = incomingHeaders.get("cookie") ?? "";
  const response = await fetch(`${baseUrl}/api/auth/token`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new UnauthenticatedError("Failed to mint access token");
  }

  const payload = (await response.json()) as { token?: string };
  const token = payload.token?.trim();
  if (!token) {
    throw new UnauthenticatedError("Missing access token");
  }
  return token;
}
