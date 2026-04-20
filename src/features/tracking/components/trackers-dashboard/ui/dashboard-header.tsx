"use client";

import { Loader2, Plus, RefreshCw } from "lucide-react";

import { TelegramConnectionStatusChip } from "@/features/tracking/components/trackers-dashboard/ui/telegram-connection-banner";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isMutating: boolean;
  isRefreshPending: boolean;
  canCreateTracker: boolean;
  telegramConnected: boolean | null;
  onRefresh: () => void;
  onOpenModal: () => void;
}

export function DashboardHeader({
  isMutating,
  isRefreshPending,
  canCreateTracker,
  telegramConnected,
  onRefresh,
  onOpenModal,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Trackers</h1>
        <p className="text-sm text-muted-foreground">Monitor prices and receive Telegram alerts.</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <TelegramConnectionStatusChip telegramConnected={telegramConnected} />
        <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={isMutating}>
          {isRefreshPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Refresh
        </Button>
        <Button
          type="button"
          size="sm"
          className="px-4"
          onClick={onOpenModal}
          disabled={!canCreateTracker}
        >
          <Plus className="size-3.5" />
          New Tracker
        </Button>
      </div>
    </header>
  );
}
