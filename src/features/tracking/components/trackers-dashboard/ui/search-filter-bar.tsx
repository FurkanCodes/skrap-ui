"use client";

import { Search } from "lucide-react";

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
  const statusOptions = STATUS_FILTERS.map((option) => ({
    value: option.key,
    label: option.label,
  }));
  const modeOptions = MODE_FILTERS.map((option) => ({
    value: option.key,
    label: option.label,
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[240px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          className="h-10 border-border bg-card pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1 rounded-md bg-card/80 p-1">
          <Chip tone="subtle" className="uppercase tracking-wide">
            Status
          </Chip>
          <SegmentedSwitch
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            ariaLabel="Status filter"
            className="border-0 bg-transparent p-0"
          />
        </div>

        <div className="inline-flex items-center gap-1 rounded-md bg-card/80 p-1">
          <Chip tone="subtle" className="uppercase tracking-wide">
            Mode
          </Chip>
          <SegmentedSwitch
            options={modeOptions}
            value={modeFilter}
            onChange={setModeFilter}
            ariaLabel="Mode filter"
            className="border-0 bg-transparent p-0"
          />
        </div>
      </div>
    </div>
  );
}
