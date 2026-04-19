import "server-only";

import { cache } from "react";

import {
  getServerSession,
  getSessionMeCacheKey,
  getSessionUserId,
} from "@/lib/server-session";

export interface AuthContext {
  authSession: Awaited<ReturnType<typeof getServerSession>>;
  userId: string;
  meCacheKey: string | null;
}

/**
 * Centralized auth context for the current request. This is the single place
 * where session identity is derived, matching Next.js DAL guidance.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const authSession = await getServerSession();
  const userId = getSessionUserId(authSession);
  if (!authSession || !userId) {
    return null;
  }

  const meCacheKey = getSessionMeCacheKey(authSession, userId);

  return {
    authSession,
    userId,
    meCacheKey,
  };
});
