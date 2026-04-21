"use client";

import { Loader2, X } from "lucide-react";

import { INTERVAL_OPTIONS } from "@/features/tracking/components/trackers-dashboard/constants";
import type { TrackingMode } from "@/features/tracking/components/trackers-dashboard/types";
import type { TrackedItemPreview } from "@/features/tracking/types";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PreviewCard } from "@/features/tracking/components/trackers-dashboard/ui/preview-card";
import { TrackingModePicker } from "@/features/tracking/components/trackers-dashboard/ui/tracking-mode-picker";

interface CreateTrackerModalProps {
  isModalOpen: boolean;
  modalStep: 1 | 2;
  setModalStep: (step: 1 | 2) => void;
  closeModal: () => void;
  isPreviewPending: boolean;
  isSavePending: boolean;
  urlInput: string;
  setUrlInput: (value: string) => void;
  fetchProductPreview: () => void;
  preview: TrackedItemPreview | null;
  trackingMode: TrackingMode;
  setTrackingMode: (value: TrackingMode) => void;
  targetAmount: string;
  setTargetAmount: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  minInterval: number;
  telegramConnected: boolean | null;
  modalError: string | null;
  saveTracker: () => void;
}

export function CreateTrackerModal({
  isModalOpen,
  modalStep,
  setModalStep,
  closeModal,
  isPreviewPending,
  isSavePending,
  urlInput,
  setUrlInput,
  fetchProductPreview,
  preview,
  trackingMode,
  setTrackingMode,
  targetAmount,
  setTargetAmount,
  interval,
  setInterval,
  minInterval,
  telegramConnected,
  modalError,
  saveTracker,
}: CreateTrackerModalProps) {
  if (!isModalOpen) {
    return null;
  }

  const intervalOptions = INTERVAL_OPTIONS.filter((option) => option.value >= minInterval).map(
    (option) => ({
      value: String(option.value),
      label: option.label,
    })
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[oklch(0.15_0_0_/_0.45)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-tracker-title"
        className="max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-xl border border-border/70 bg-card shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <p id="create-tracker-title" className="text-2xl font-semibold leading-tight text-foreground">
              {modalStep === 1 ? "Add New Tracker" : "Configure Tracker"}
            </p>
            <p className="text-sm text-muted-foreground">Step {modalStep} of 2</p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="mt-0.5"
            onClick={closeModal}
            disabled={isPreviewPending || isSavePending}
            aria-label="Close add tracker modal"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {modalStep === 1 ? (
            <>
              <div className="space-y-2.5">
                <Label htmlFor="new-tracker-url" className="text-sm font-semibold text-foreground">
                  Product URL
                </Label>
                <Input
                  id="new-tracker-url"
                  value={urlInput}
                  onChange={(event) => setUrlInput(event.target.value)}
                  placeholder="https://amazon.com/dp/..."
                  className="h-11 border-input bg-background/60"
                  disabled={isPreviewPending}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a full product page link to fetch title, image, and current price.
                </p>
              </div>

              <Button
                type="button"
                className="h-11 w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                disabled={isPreviewPending || !urlInput.trim()}
                aria-busy={isPreviewPending ? true : undefined}
                onClick={fetchProductPreview}
              >
                {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Fetch Product Info
              </Button>
            </>
          ) : (
            <>
              {preview ? <PreviewCard preview={preview} /> : null}

              <TrackingModePicker trackingMode={trackingMode} setTrackingMode={setTrackingMode} />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="target-price" className="text-xs font-semibold text-foreground">
                    Target price
                  </Label>
                  <CurrencyInput
                    id="target-price"
                    currency={preview?.currency}
                    value={targetAmount}
                    onChange={(event) => setTargetAmount(event.target.value)}
                    placeholder="84.99"
                    disabled={trackingMode === "monitor" || isSavePending}
                    className="h-11 border-input"
                  />
                  {trackingMode === "monitor" ? (
                    <p className="text-xs text-muted-foreground">
                      Monitor mode ignores target price and sends interval-based updates.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      We notify once the price drops to this amount or lower.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="check-every" className="text-xs font-semibold text-foreground">
                    Check every
                  </Label>
                  <AnimatedDropdown
                    id="check-every"
                    options={intervalOptions}
                    value={interval}
                    onValueChange={setInterval}
                    disabled={isSavePending}
                  />
                </div>
              </div>

              {telegramConnected === false ? (
                <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold">Telegram not connected</p>
                  <p className="mt-0.5">Alerts will not be delivered until you link Telegram in Settings.</p>
                </div>
              ) : null}
            </>
          )}

          {modalError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {modalError}
            </p>
          ) : null}
        </div>

        {modalStep === 2 ? (
          <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalStep(1)}
              disabled={isSavePending}
            >
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              className="px-4"
              onClick={saveTracker}
              disabled={isSavePending || isPreviewPending}
            >
              {isSavePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Save Tracker
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
