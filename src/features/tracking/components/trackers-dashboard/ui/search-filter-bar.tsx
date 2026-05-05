"use client";

import { IconSearch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { MODE_FILTERS, STATUS_FILTERS } from "@/features/tracking/components/trackers-dashboard/constants";
import type {
  ModeFilterKey,
  StatusFilterKey,
} from "@/features/tracking/components/trackers-dashboard/types";
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

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[11px] font-semibold uppercase leading-none text-muted-foreground">
        {label}
      </span>
      <SegmentedSwitch
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        fullWidth
        className="border-0 bg-muted/45 p-1 sm:w-auto"
      />
    </div>
  );
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
    <div className="space-y-2.5">
      <div className="relative min-w-0">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" stroke={1.5} />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 bg-muted pl-9"
        />
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <FilterGroup
          label={t("statusLabel")}
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel={t("statusAria")}
        />
        <FilterGroup
          label={t("modeLabel")}
          options={modeOptions}
          value={modeFilter}
          onChange={setModeFilter}
          ariaLabel={t("modeAria")}
        />
      </div>
    </div>
  );
}
