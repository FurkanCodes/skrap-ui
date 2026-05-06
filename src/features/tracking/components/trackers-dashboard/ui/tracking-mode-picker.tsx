"use client";

import { getMessages } from "@/lib/messages";
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
  const t = getMessages("tracking.dashboard.modePicker");
  const options: Array<{
    value: TrackingMode;
    label: string;
    tooltip: { title: string; description: string };
  }> = [
    {
      value: "alert",
      label: t("alert.label"),
      tooltip: {
        title: t("alert.label"),
        description: t("alert.description"),
      },
    },
    {
      value: "monitor",
      label: t("monitor.label"),
      tooltip: {
        title: t("monitor.label"),
        description: t("monitor.description"),
      },
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-foreground">{t("title")}</Label>
      <SegmentedSwitch
        options={options}
        value={trackingMode}
        onChange={setTrackingMode}
        ariaLabel={t("ariaLabel")}
        fullWidth
        className="rounded-lg border border-border/70 bg-muted/45 p-1 dark:bg-muted/35"
      />
    </div>
  );
}
