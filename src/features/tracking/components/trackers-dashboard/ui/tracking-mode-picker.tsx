"use client";

import { Label } from "@/components/ui/label";
import type { TrackingMode } from "@/features/tracking/components/trackers-dashboard/types";

interface TrackingModePickerProps {
  trackingMode: TrackingMode;
  setTrackingMode: (value: TrackingMode) => void;
}

export function TrackingModePicker({
  trackingMode,
  setTrackingMode,
}: TrackingModePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">Tracking mode</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTrackingMode("alert")}
          className={
            trackingMode === "alert"
              ? "rounded-md border-2 border-foreground bg-background p-3 text-left"
              : "rounded-md border border-border bg-background p-3 text-left"
          }
        >
          <p className="text-sm font-semibold text-foreground">Price Alert</p>
          <p className="mt-1 text-xs text-muted-foreground">Notify once target is reached.</p>
        </button>
        <button
          type="button"
          onClick={() => setTrackingMode("monitor")}
          className={
            trackingMode === "monitor"
              ? "rounded-md border-2 border-foreground bg-background p-3 text-left"
              : "rounded-md border border-border bg-background p-3 text-left"
          }
        >
          <p className="text-sm font-semibold text-foreground">Periodic Monitor</p>
          <p className="mt-1 text-xs text-muted-foreground">Send recurring updates.</p>
        </button>
      </div>
    </div>
  );
}
