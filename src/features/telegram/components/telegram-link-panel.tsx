import { headers } from "next/headers";

import { TelegramLinkCard } from "@/features/telegram/components/telegram-link-card";
import { getTelegramStatusQuery } from "@/features/telegram/server/queries";
import type { TelegramActiveStatusResponse } from "@/features/telegram/types";
import { getAuth } from "@/lib/auth";

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

export async function TelegramLinkPanel() {
  const auth = getAuth();
  const incomingHeaders = await headers();
  const session = await auth.api.getSession({ headers: incomingHeaders });

  if (!session?.user) {
    return (
      <TelegramLinkCard
        isAuthenticated={false}
        initialStatus={null}
        initialError={null}
      />
    );
  }

  let initialStatus: TelegramActiveStatusResponse | null = null;
  let initialError: string | null = null;

  try {
    initialStatus = await getTelegramStatusQuery();
  } catch (error) {
    initialError = mapError(error);
  }

  return (
    <TelegramLinkCard
      isAuthenticated={true}
      initialStatus={initialStatus}
      initialError={initialError}
    />
  );
}
