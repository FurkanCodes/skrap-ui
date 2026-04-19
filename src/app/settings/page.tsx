import { createHash } from "crypto";
import { headers } from "next/headers";

import AppSidebar from "@/components/layout/app-sidebar";
import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import { getMeQuery } from "@/features/tracking/server/queries";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
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

function getSessionUserId(session: unknown): string | null {
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

function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Unable to load Telegram status.";
}

export default async function SettingsPage() {
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

  let initialStatus: TelegramActiveStatusResponse | null = null;
  let initialError: string | null = null;
  let trackedCount = 0;

  if (session?.user) {
    try {
      initialStatus = await getTelegramStatusQuery();
    } catch (error) {
      initialError = mapError(error);
    }

    try {
      const tracked = await listTrackedItemsQuery({ userId: getSessionUserId(session) });
      trackedCount = tracked.items.length;
    } catch {
      trackedCount = 0;
    }
  }

  return (
    <ViewerProvider initialMe={initialMe} initialUserKey={initialUserKey}>
      <AppSidebar>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.8)_0%,_rgba(244,245,249,1)_45%,_rgba(244,245,249,1)_100%)]">
          <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
            <SettingsPageClient
              isAuthenticated={Boolean(session?.user)}
              initialStatus={initialStatus}
              initialError={initialError}
              trackedCount={trackedCount}
            />
          </div>
        </div>
      </AppSidebar>
    </ViewerProvider>
  );
}
