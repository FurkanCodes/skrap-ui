import "server-only";

import { createHash } from "crypto";
import { cache } from "react";
import { headers } from "next/headers";

import { getAuth } from "@/lib/auth";

export const getServerSession = cache(async () => {
  const auth = getAuth();
  const incomingHeaders = await headers();
  return auth.api.getSession({ headers: incomingHeaders });
});

export function getSessionUserKey(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown; email?: unknown; name?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  if (typeof user.email === "string" && user.email.trim().length > 0) {
    return user.email;
  }

  if (typeof user.name === "string" && user.name.trim().length > 0) {
    return user.name;
  }

  return null;
}

export function getSessionUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const user = (session as { user?: { id?: unknown } }).user;
  if (!user || typeof user !== "object") {
    return null;
  }

  if (typeof user.id === "string" && user.id.trim().length > 0) {
    return user.id;
  }

  return null;
}

export function getSessionMeCacheKey(session: unknown, sessionUserKey: string | null): string | null {
  if (!session || typeof session !== "object") {
    return null;
  }

  const maybeSession = (session as { session?: { id?: unknown; token?: unknown } }).session;
  if (maybeSession && typeof maybeSession === "object") {
    if (typeof maybeSession.id === "string" && maybeSession.id.trim().length > 0) {
      return `sid:${maybeSession.id}`;
    }

    if (typeof maybeSession.token === "string" && maybeSession.token.trim().length > 0) {
      return `tok:${createHash("sha256").update(maybeSession.token).digest("hex")}`;
    }
  }

  if (sessionUserKey) {
    return `usr:${sessionUserKey}`;
  }

  return null;
}
