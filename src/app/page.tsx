import { createHash } from "crypto";
import { headers } from "next/headers";

import AppSidebar from "@/components/layout/app-sidebar";
import { TrackersDashboard } from "@/features/tracking/components/trackers-dashboard";
import { getMeQuery } from "@/features/tracking/server/queries";
import type { MeResponse } from "@/features/tracking/types";
import { ViewerProvider } from "@/features/tracking/viewer/viewer-provider";
import { getAuth } from "@/lib/auth";

function getSessionUserKey(session: unknown): string | null {
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

function getSessionMeCacheKey(session: unknown, sessionUserKey: string | null): string | null {
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

export default async function HomePage() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });

  const sessionUserKey = getSessionUserKey(session);
  const meCacheKey = getSessionMeCacheKey(session, sessionUserKey);

  let initialMe: MeResponse | null = null;
  if (sessionUserKey) {
    try {
      initialMe = await getMeQuery({ cacheKey: meCacheKey });
    } catch {
      initialMe = null;
    }
  }

  const initialUserKey = initialMe?.user.user_id ?? sessionUserKey;

  return (
    <ViewerProvider initialMe={initialMe} initialUserKey={initialUserKey}>
      <AppSidebar>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8)_0%,_rgba(244,245,249,1)_45%,_rgba(244,245,249,1)_100%)]">
          <div className="mx-auto w-full max-w-6xl p-6 lg:p-8">
            <TrackersDashboard />
          </div>
        </div>
      </AppSidebar>
    </ViewerProvider>
  );
}
