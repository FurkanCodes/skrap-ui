"use client";

import { Label } from "@/components/ui/label";
import type { TrackingMode } from "@/features/tracking/components/trackers-dashboard/types";
import { SegmentedSwitch } from "@/features/tracking/components/trackers-dashboard/ui/segmented-switch";

interface TrackingModePickerProps {
  trackingMode: TrackingMode;
  setTrackingMode: (value: TrackingMode) => void;
}

export function TrackingModePicker({
  trackingMode,
  setTrackingMode,
}: TrackingModePickerProps) {
  const options: Array<{
    value: TrackingMode;
    label: string;
    tooltip: { title: string; description: string };
  }> = [
    {
      value: "alert",
      label: "Price Alert",
      tooltip: {
        title: "Price Alert",
        description: "Sends one notification when price reaches your target.",
      },
    },
    {
      value: "monitor",
      label: "Price Drop",
      tooltip: {
        title: "Price Drop",
        description: "Sends a notification only when price drops from the previous check.",
      },
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">Mode</Label>
      <SegmentedSwitch
        options={options}
        value={trackingMode}
        onChange={setTrackingMode}
        ariaLabel="Tracking mode"
        fullWidth
        className="rounded-lg border border-border/70 bg-muted/45 p-1 dark:bg-muted/35"
      />
    </div>
  );
}
