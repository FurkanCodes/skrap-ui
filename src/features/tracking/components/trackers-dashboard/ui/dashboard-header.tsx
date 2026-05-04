"use client";

import { IconLoader2, IconPlus, IconRefresh } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { TelegramConnectionStatusChip } from "@/features/tracking/components/trackers-dashboard/ui/telegram-connection-banner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardHeaderProps {
  isMutating: boolean;
  isRefreshPending: boolean;
  canCreateTracker: boolean;
  createTrackerDisabledReason: string | null;
  telegramConnected: boolean | null;
  onRefresh: () => void;
  onOpenModal: () => void;
}

export function DashboardHeader({
  isMutating,
  isRefreshPending,
  canCreateTracker,
  createTrackerDisabledReason,
  telegramConnected,
  onRefresh,
  onOpenModal,
}: DashboardHeaderProps) {
  const t = useTranslations("tracking.dashboard.header");

  return (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <TelegramConnectionStatusChip telegramConnected={telegramConnected} />
        <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isMutating}>
          {isRefreshPending ? (
            <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} />
          ) : (
            <IconRefresh className="size-3.5" stroke={1.5} />
          )}
          {t("refresh")}
        </Button>
        {createTrackerDisabledReason ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="inline-flex">
                  <Button
                    type="button"
                    size="sm"
                    className="px-4"
                    onClick={onOpenModal}
                    disabled={!canCreateTracker}
                  >
                    <IconPlus className="size-3.5" stroke={1.5} />
                    {t("newTracker")}
                  </Button>
                </span>
              }
            />
            <TooltipContent>{createTrackerDisabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            type="button"
            size="sm"
            className="px-4"
            onClick={onOpenModal}
            disabled={!canCreateTracker}
          >
            <IconPlus className="size-3.5" stroke={1.5} />
            {t("newTracker")}
          </Button>
        )}
      </div>
      {createTrackerDisabledReason ? (
        <p className="ml-auto text-xs text-muted-foreground">{createTrackerDisabledReason}</p>
      ) : null}
    </header>
  );
}
