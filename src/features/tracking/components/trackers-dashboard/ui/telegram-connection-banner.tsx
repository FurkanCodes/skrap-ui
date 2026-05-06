"use client";

import { getMessages } from "@/lib/messages";
import { IconBell, IconExternalLink } from "@tabler/icons-react";

import { TelegramStatusChip } from "@/features/telegram/components/telegram-status-chip";
import { Link } from "@/i18n/navigation";

interface TelegramConnectionBannerProps {
  telegramConnected: boolean | null;
}

interface TelegramConnectionStatusChipProps {
  telegramConnected: boolean | null;
}

export function TelegramConnectionStatusChip({
  telegramConnected,
}: TelegramConnectionStatusChipProps) {
  const t = getMessages("tracking.dashboard.telegram");

  if (telegramConnected !== true) {
    return null;
  }

  return (
    <TelegramStatusChip
      connected={true}
      connectedLabel={t("connectedChip")}
      disconnectedLabel=""
    />
  );
}

export function TelegramConnectionBanner({ telegramConnected }: TelegramConnectionBannerProps) {
  const t = getMessages("tracking.dashboard.telegram");

  if (telegramConnected === false) {
    return (
      <Link
        href="/settings"
        className="block rounded-lg border border-border bg-card px-4 py-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-md bg-zinc-900 text-white">
              <IconBell className="size-4" stroke={1.5} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{t("connectTitle")}</p>
              <p className="text-xs text-muted-foreground">
                {t("connectDescription")}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
            {t("setup")} <IconExternalLink className="size-3" stroke={1.5} />
          </span>
        </div>
      </Link>
    );
  }

  return null;
}
