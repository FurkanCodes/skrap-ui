import { getTranslations } from "next-intl/server";

import { NotificationsPageClient } from "@/features/settings/components/notifications-page-client";
import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { getAuthContext } from "@/lib/auth-dal";

function mapError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

export default async function NotificationsPage() {
  const t = await getTranslations("telegram.errors");
  const auth = await getAuthContext();
  let initialStatus: TelegramActiveStatusResponse | null = null;
  let initialError: string | null = null;

  if (auth) {
    const telegramResult = await Promise.allSettled([getTelegramStatusQuery()]);

    if (telegramResult[0].status === "fulfilled") {
      initialStatus = telegramResult[0].value;
    } else {
      initialError = mapError(telegramResult[0].reason, t("loadStatus"));
    }
  }

  return (
    <NotificationsPageClient
      isAuthenticated={Boolean(auth)}
      initialStatus={initialStatus}
      initialError={initialError}
    />
  );
}
