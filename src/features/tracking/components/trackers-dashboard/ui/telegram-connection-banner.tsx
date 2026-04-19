"use client";

import Link from "next/link";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";

interface TelegramConnectionBannerProps {
  telegramConnected: boolean | null;
  botUsername: string;
}

export function TelegramConnectionBanner({
  telegramConnected,
  botUsername,
}: TelegramConnectionBannerProps) {
  if (telegramConnected === false) {
    return (
      <Link
        href="/settings"
        prefetch={false}
        className="block rounded-lg border border-border bg-card px-4 py-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-zinc-900 text-white">
              <Bell className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Connect Telegram to receive alerts</p>
              <p className="text-xs text-muted-foreground">
                Without Telegram, price drop and monitoring notifications cannot be delivered.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
            Set up <ExternalLink className="size-3" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:text-emerald-200">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <CheckCircle2 className="size-4" /> Telegram connected
        {botUsername ? (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            @{botUsername}
          </span>
        ) : null}
      </div>
    </div>
  );
}
