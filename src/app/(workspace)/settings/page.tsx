import { SettingsPageClient } from "@/features/settings/components/settings-page-client";
import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import { listTrackedItemsQuery } from "@/features/tracking/server/queries";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { getAuthContext } from "@/lib/auth-dal";

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
  let initialStatus: TelegramActiveStatusResponse | null = null;
  let initialError: string | null = null;
  let trackedCount = 0;
  const auth = await getAuthContext();

  if (auth) {
    const [telegramResult, trackedResult] = await Promise.allSettled([
      getTelegramStatusQuery(),
      listTrackedItemsQuery({ userId: auth.userId }),
    ]);

    if (telegramResult.status === "fulfilled") {
      initialStatus = telegramResult.value;
    } else {
      initialError = mapError(telegramResult.reason);
    }

    if (trackedResult.status === "fulfilled") {
      trackedCount = trackedResult.value.items.length;
    } else {
      trackedCount = 0;
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
      <SettingsPageClient
        initialStatus={initialStatus}
        initialError={initialError}
        trackedCount={trackedCount}
      />
    </div>
  );
}
