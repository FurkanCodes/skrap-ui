"use client";

import { Loader2 } from "lucide-react";

import { INTERVAL_OPTIONS } from "@/features/tracking/components/trackers-dashboard/constants";
import type { TrackingMode } from "@/features/tracking/components/trackers-dashboard/types";
import { TrackingModePicker } from "@/features/tracking/components/trackers-dashboard/ui/tracking-mode-picker";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditTrackerModalProps {
  isOpen: boolean;
  item: TrackedItemSummary | null;
  trackingMode: TrackingMode;
  setTrackingMode: (value: TrackingMode) => void;
  targetAmount: string;
  setTargetAmount: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  minInterval: number;
  error: string | null;
  isSavePending: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function EditTrackerModal({
  isOpen,
  item,
  trackingMode,
  setTrackingMode,
  targetAmount,
  setTargetAmount,
  interval,
  setInterval,
  minInterval,
  error,
  isSavePending,
  onClose,
  onSave,
}: EditTrackerModalProps) {
  if (!isOpen || !item) {
    return null;
  }

  const title = item.product_name ?? item.source_url;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4">
      <div className="w-full max-w-[460px] overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-bold text-foreground">Edit Tracker</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{title}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            disabled={isSavePending}
          >
            ×
          </Button>
        </div>

        <div className="space-y-5 p-5">
          <TrackingModePicker
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-target-price" className="text-xs font-semibold text-foreground">
                Target price
              </Label>
              <Input
                id="edit-target-price"
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="84.99"
                disabled={trackingMode === "monitor" || isSavePending}
                className="h-10 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-check-every" className="text-xs font-semibold text-foreground">
                Check every
              </Label>
              <select
                id="edit-check-every"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none ring-ring/40 transition focus:ring-2"
                value={interval}
                onChange={(event) => setInterval(event.target.value)}
                disabled={isSavePending}
              >
                {INTERVAL_OPTIONS.filter((option) => option.value >= minInterval).map((option) => (
                  <option key={`${option.label}-${option.value}`} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSavePending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="px-4"
            onClick={onSave}
            disabled={isSavePending}
          >
            {isSavePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
