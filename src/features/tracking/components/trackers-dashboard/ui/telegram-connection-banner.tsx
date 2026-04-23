"use client";

import Link from "next/link";
import { Bell, CheckCircle2, ExternalLink } from "lucide-react";

import { Chip } from "@/components/ui/chip";

interface TelegramConnectionBannerProps {
  telegramConnected: boolean | null;
}

interface TelegramConnectionStatusChipProps {
  telegramConnected: boolean | null;
}

export function TelegramConnectionStatusChip({
  telegramConnected,
}: TelegramConnectionStatusChipProps) {
  if (telegramConnected !== true) {
    return null;
  }

  return (
    <Chip
      tone="success"
      className="rounded-full bg-emerald-500/14 text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-500/22 dark:text-emerald-200 dark:ring-emerald-400/30"
    >
      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-300" />
      <span>Telegram connected</span>
    </Chip>
  );
}

export function TelegramConnectionBanner({ telegramConnected }: TelegramConnectionBannerProps) {
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
                Without Telegram, price-drop, price-increase, and tracking status alerts cannot be delivered.
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

  return null;
}
