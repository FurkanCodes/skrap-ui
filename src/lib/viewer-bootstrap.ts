import "server-only";

import { cache } from "react";

import { getMeQuery } from "@/features/tracking/server/queries";
import type { MeResponse } from "@/features/tracking/types";
import { getAuthContext } from "@/lib/auth-dal";
import { extractSessionUser, type ViewerSessionUser } from "@/lib/session-user";

export interface ViewerBootstrap {
  initialMe: MeResponse | null;
  initialUserKey: string | null;
  initialSessionUser: ViewerSessionUser | null;
}

/**
 * Loads minimal viewer bootstrap data for shared workspace UI.
 * Authorization remains centralized in DAL consumers/server actions.
 */
export const getViewerBootstrap = cache(async (): Promise<ViewerBootstrap> => {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      initialMe: null,
      initialUserKey: null,
      initialSessionUser: null,
    };
  }

  let initialMe: MeResponse | null = null;
  try {
    initialMe = await getMeQuery({ cacheKey: auth.meCacheKey });
  } catch {
    initialMe = null;
  }

  return {
    initialMe,
    initialUserKey: initialMe?.user.user_id ?? auth.userId,
    initialSessionUser: extractSessionUser(auth.authSession),
  };
});
