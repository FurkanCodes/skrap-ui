"use client";

import { IconBell, IconCircleCheck, IconExternalLink } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { Chip } from "@/components/ui/chip";
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
  const t = useTranslations("tracking.dashboard.telegram");

  if (telegramConnected !== true) {
    return null;
  }

  return (
    <Chip
      tone="success"
      className="rounded-full bg-emerald-500/14 text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-500/22 dark:text-emerald-200 dark:ring-emerald-400/30"
    >
      <IconCircleCheck className="size-3.5 text-emerald-600 dark:text-emerald-300" stroke={1.5} />
      <span>{t("connectedChip")}</span>
    </Chip>
  );
}

export function TelegramConnectionBanner({ telegramConnected }: TelegramConnectionBannerProps) {
  const t = useTranslations("tracking.dashboard.telegram");

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
