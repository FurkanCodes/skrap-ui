"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { MODE_FILTERS, STATUS_FILTERS } from "@/features/tracking/components/trackers-dashboard/constants";
import type {
  ModeFilterKey,
  StatusFilterKey,
} from "@/features/tracking/components/trackers-dashboard/types";
import { Chip } from "@/components/ui/chip";
import { SegmentedSwitch } from "@/features/tracking/components/trackers-dashboard/ui/segmented-switch";
import { Input } from "@/components/ui/input";

interface SearchFilterBarProps {
  query: string;
  setQuery: (query: string) => void;
  statusFilter: StatusFilterKey;
  setStatusFilter: (filter: StatusFilterKey) => void;
  modeFilter: ModeFilterKey;
  setModeFilter: (filter: ModeFilterKey) => void;
}

export function SearchFilterBar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  modeFilter,
  setModeFilter,
}: SearchFilterBarProps) {
  const t = useTranslations("tracking.dashboard.filters");
  const statusOptions = STATUS_FILTERS.map((option) => ({
    value: option.key,
    label:
      option.key === "all"
        ? t("status.all")
        : option.key === "active"
          ? t("status.active")
          : t("status.paused"),
  }));
  const modeOptions = MODE_FILTERS.map((option) => ({
    value: option.key,
    label:
      option.key === "all"
        ? t("mode.all")
        : option.key === "alert"
          ? t("mode.alert")
          : t("mode.monitor"),
  }));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/15 p-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 border-border/70 bg-background pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-md bg-background/80 p-1">
          <Chip tone="subtle" className="uppercase tracking-wide">
            {t("statusLabel")}
          </Chip>
          <SegmentedSwitch
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel={t("statusAria")}
            className="border-0 bg-transparent p-0"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-md bg-background/80 p-1">
          <Chip tone="subtle" className="uppercase tracking-wide">
            {t("modeLabel")}
          </Chip>
          <SegmentedSwitch
            options={modeOptions}
            value={modeFilter}
            onChange={setModeFilter}
            ariaLabel={t("modeAria")}
            className="border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </div>
  );
}
