"use client";

import { Search } from "lucide-react";

import { FILTERS } from "@/features/tracking/components/trackers-dashboard/constants";
import type { FilterKey } from "@/features/tracking/components/trackers-dashboard/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFilterBarProps {
  query: string;
  setQuery: (query: string) => void;
  filter: FilterKey;
  setFilter: (filter: FilterKey) => void;
}

export function SearchFilterBar({
  query,
  setQuery,
  filter,
  setFilter,
}: SearchFilterBarProps) {
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

      <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card p-1">
        {FILTERS.map((option) => (
          <Button
            key={option.key}
            type="button"
            size="xs"
            variant={filter === option.key ? "default" : "ghost"}
            className="px-3"
            onClick={() => setFilter(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
