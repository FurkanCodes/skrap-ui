import "server-only";

import { createHash } from "crypto";
import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";

export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
  updatedAt: number;
}

const ACCESS_TOKEN_CACHE_LIMIT = 256;
const ACCESS_TOKEN_SKEW_MS = 30_000;
const ACCESS_TOKEN_FALLBACK_TTL_MS = 14 * 60 * 1000;
const accessTokenCache = new Map<string, CachedAccessToken>();

function getCookieCacheKey(cookieHeader: string): string {
  return createHash("sha256").update(cookieHeader).digest("hex");
}

function parseTokenExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }
  } catch {
    return null;
  }

  return null;
}

function pruneAccessTokenCache(now = Date.now()): void {
  for (const [key, cached] of accessTokenCache) {
    if (cached.expiresAt <= now + ACCESS_TOKEN_SKEW_MS) {
      accessTokenCache.delete(key);
    }
  }

  while (accessTokenCache.size > ACCESS_TOKEN_CACHE_LIMIT) {
    let oldestKey: string | null = null;
    let oldestSeen = Number.POSITIVE_INFINITY;

    for (const [key, cached] of accessTokenCache) {
      if (cached.updatedAt < oldestSeen) {
        oldestSeen = cached.updatedAt;
        oldestKey = key;
      }
    }

    if (!oldestKey) {
      break;
    }
    accessTokenCache.delete(oldestKey);
  }
}

function readCachedAccessToken(cacheKey: string, now = Date.now()): string | null {
  const cached = accessTokenCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= now + ACCESS_TOKEN_SKEW_MS) {
    accessTokenCache.delete(cacheKey);
    return null;
  }

  cached.updatedAt = now;
  return cached.token;
}

function writeCachedAccessToken(cacheKey: string, token: string, now = Date.now()): void {
  const expiresAt = parseTokenExpiryMs(token) ?? now + ACCESS_TOKEN_FALLBACK_TTL_MS;
  accessTokenCache.set(cacheKey, {
    token,
    expiresAt,
    updatedAt: now,
  });
  pruneAccessTokenCache(now);
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

  // Prefer the typed Better Auth API function when available.
  const maybeApi = auth.api as unknown as {
    getToken?: (input: { headers: Headers }) => Promise<{ token?: string } | null>;
  };

  const incomingHeaders = await headers();
  const cookieHeader = incomingHeaders.get("cookie") ?? "";
  const cacheKey = getCookieCacheKey(cookieHeader);
  const cachedToken = readCachedAccessToken(cacheKey);
  if (cachedToken) {
    return cachedToken;
  }

  if (typeof maybeApi.getToken === "function") {
    const tokenResponse = await maybeApi.getToken({ headers: incomingHeaders });
    const token = tokenResponse?.token?.trim();
    if (token) {
      writeCachedAccessToken(cacheKey, token);
      return token;
    }
  }

  // Fallback to REST endpoint for JWT plugin compatibility.
  const baseUrl = process.env.BETTER_AUTH_URL;
  if (!baseUrl) {
    throw new Error("BETTER_AUTH_URL is required");
  }
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
  writeCachedAccessToken(cacheKey, token);
  return token;
}
