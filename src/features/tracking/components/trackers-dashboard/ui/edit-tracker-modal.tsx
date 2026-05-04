"use client";

import { IconLoader2 } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

import { INTERVAL_OPTIONS } from "@/features/tracking/components/trackers-dashboard/constants";
import type { TrackingMode } from "@/features/tracking/components/trackers-dashboard/types";
import { TrackingModePicker } from "@/features/tracking/components/trackers-dashboard/ui/tracking-mode-picker";
import type { TrackedItemSummary } from "@/features/tracking/types";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
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
  notifyOnPriceIncrease: boolean;
  notifyOnStockChange: boolean;
  setNotifyOnPriceIncrease: (value: boolean) => void;
  setNotifyOnStockChange: (value: boolean) => void;
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
  notifyOnPriceIncrease,
  notifyOnStockChange,
  setNotifyOnPriceIncrease,
  setNotifyOnStockChange,
  minInterval,
  error,
  isSavePending,
  onClose,
  onSave,
}: EditTrackerModalProps) {
  const t = useTranslations("tracking.dashboard.editModal");

  if (!isOpen || !item) {
    return null;
  }

  const title = item.product_name ?? item.source_url;
  const intervalOptions = INTERVAL_OPTIONS.filter((option) => option.value >= minInterval).map(
    (option) => ({
      value: String(option.value),
      label: option.label,
    })
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4">
      <div className="w-full max-w-[460px] rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-base font-bold text-foreground">{t("title")}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{title}</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
            disabled={isSavePending}
            aria-label={t("close")}
          >
            ×
          </Button>
        </div>

        <div className="space-y-4 p-5">
          <TrackingModePicker
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
          />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-target-price" className="text-xs font-semibold text-foreground">
                {t("targetPrice")}
              </Label>
              <CurrencyInput
                id="edit-target-price"
                currency={item.currency}
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="84.99"
                disabled={trackingMode === "monitor" || isSavePending}
                className="h-10 border-border"
              />
              {trackingMode === "monitor" ? (
                <p className="text-[11px] text-muted-foreground">
                  {notifyOnPriceIncrease
                    ? t("monitorBothDirectionsHint")
                    : t("monitorHint")}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {t("alertHint")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-check-every" className="text-xs font-semibold text-foreground">
                {t("interval")}
              </Label>
              <AnimatedDropdown
                id="edit-check-every"
                options={intervalOptions}
                value={interval}
                onValueChange={setInterval}
                disabled={isSavePending}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">{t("extraAlerts")}</Label>
              <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-muted/25 px-3 py-2 text-xs text-foreground">
                <Checkbox
                  checked={notifyOnPriceIncrease}
                  onCheckedChange={(checked) =>
                    setNotifyOnPriceIncrease(Boolean(checked))
                  }
                  disabled={isSavePending}
                />
                {t("notifyIncrease")}
              </Label>
              <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-muted/25 px-3 py-2 text-xs text-foreground">
                <Checkbox
                  checked={notifyOnStockChange}
                  onCheckedChange={(checked) =>
                    setNotifyOnStockChange(Boolean(checked))
                  }
                  disabled={isSavePending}
                />
                {t("notifyStockChange")}
              </Label>
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSavePending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            className="px-4"
            onClick={onSave}
            disabled={isSavePending}
          >
            {isSavePending ? <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} /> : null}
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
