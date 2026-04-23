"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CircleAlert,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";

import { INTERVAL_OPTIONS } from "@/features/tracking/components/trackers-dashboard/constants";
import type {
  BulkTrackerDraft,
  TrackerUrlInputRow,
  TrackingMode,
} from "@/features/tracking/components/trackers-dashboard/types";
import { formatPrice, getDomainLabel } from "@/features/tracking/components/trackers-dashboard/utils";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrackingModePicker } from "@/features/tracking/components/trackers-dashboard/ui/tracking-mode-picker";
import { cn } from "@/lib/utils";

interface CreateTrackerModalProps {
  isModalOpen: boolean;
  modalStep: 1 | 2;
  closeModal: () => void;
  isPreviewPending: boolean;
  isSavePending: boolean;
  urlRows: TrackerUrlInputRow[];
  drafts: BulkTrackerDraft[];
  activeDraftId: string | null;
  activeDraft: BulkTrackerDraft | null;
  sharedTrackingMode: TrackingMode;
  setSharedTrackingMode: (value: TrackingMode) => void;
  sharedInterval: string;
  setSharedInterval: (value: string) => void;
  sharedNotifyOnPriceIncrease: boolean;
  setSharedNotifyOnPriceIncrease: (value: boolean) => void;
  minInterval: number;
  remainingSlots: number;
  canSaveDrafts: boolean;
  bulkResultSummary: {
    successCount: number;
    failureCount: number;
  } | null;
  telegramConnected: boolean | null;
  modalError: string | null;
  setUrlRowValue: (rowId: string, value: string) => void;
  addUrlRow: (afterRowId?: string) => void;
  removeUrlRow: (rowId: string) => void;
  handleUrlRowPaste: (rowId: string, pastedText: string) => boolean;
  reviewUrlRows: () => void;
  goBackToUrlStep: () => void;
  setActiveDraft: (clientId: string) => void;
  toggleDraftSelection: (clientId: string) => void;
  setDraftTrackingMode: (clientId: string, value: TrackingMode) => void;
  setDraftInterval: (clientId: string, value: string) => void;
  setDraftTargetAmount: (clientId: string, value: string) => void;
  setDraftNotifyOnPriceIncrease: (clientId: string, value: boolean) => void;
  setDraftRawUrl: (clientId: string, value: string) => void;
  retryDraftPreview: (clientId: string) => void;
  saveTracker: () => void;
}

function isHttpUrl(value: string): boolean {
  const nextValue = value.trim();
  if (!nextValue) {
    return false;
  }

  try {
    const parsed = new URL(nextValue);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function CreateTrackerModal({
  isModalOpen,
  modalStep,
  closeModal,
  isPreviewPending,
  isSavePending,
  urlRows,
  drafts,
  activeDraftId,
  activeDraft,
  sharedTrackingMode,
  setSharedTrackingMode,
  sharedInterval,
  setSharedInterval,
  sharedNotifyOnPriceIncrease,
  setSharedNotifyOnPriceIncrease,
  minInterval,
  remainingSlots,
  canSaveDrafts,
  bulkResultSummary,
  telegramConnected,
  modalError,
  setUrlRowValue,
  addUrlRow,
  removeUrlRow,
  handleUrlRowPaste,
  reviewUrlRows,
  goBackToUrlStep,
  setActiveDraft,
  toggleDraftSelection,
  setDraftTrackingMode,
  setDraftInterval,
  setDraftTargetAmount,
  setDraftNotifyOnPriceIncrease,
  setDraftRawUrl,
  retryDraftPreview,
  saveTracker,
}: CreateTrackerModalProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!isModalOpen) {
    return null;
  }

  const selectedReadyCount = drafts.filter(
    (draft) => draft.previewStatus === "ready" && draft.selected
  ).length;
  const isSingleDraft = drafts.length === 1;
  const hasAnyUrlValue = urlRows.some((row) => row.value.trim().length > 0);
  const hasInvalidUrlRow = urlRows.some(
    (row) => row.value.trim().length > 0 && !isHttpUrl(row.value)
  );
  const canReview = hasAnyUrlValue && !hasInvalidUrlRow && !isPreviewPending;

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
        className={cn(
          "w-full max-w-[920px] rounded-xl border border-border/70 bg-card shadow-xl",
          modalStep === 1 ? "max-h-[90vh] overflow-y-auto" : "overflow-visible"
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <p id="create-tracker-title" className="text-2xl font-semibold leading-tight text-foreground">
              {modalStep === 1 ? "Add Trackers" : "Review & Configure"}
            </p>
            <p className="text-sm text-muted-foreground">
              Step {modalStep} of 2 · {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} available
            </p>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Product URLs</Label>
                <p className="text-xs text-muted-foreground">
                  Paste one or many links. Multi-url paste automatically fans out into rows.
                </p>
              </div>

              <div className="space-y-2.5">
                {urlRows.map((row, index) => {
                  const hasValue = row.value.trim().length > 0;
                  const invalid = hasValue && !isHttpUrl(row.value);
                  return (
                    <div key={row.id} className="space-y-1.5">
                      <div className="relative">
                        <Input
                          value={row.value}
                          onChange={(event) => setUrlRowValue(row.id, event.target.value)}
                          onPaste={(event) => {
                            const handled = handleUrlRowPaste(
                              row.id,
                              event.clipboardData.getData("text")
                            );
                            if (handled) {
                              event.preventDefault();
                            }
                          }}
                          placeholder="https://amazon.com/dp/..."
                          className={cn(
                            "h-11 border-input bg-background/70 pr-20 dark:bg-muted/25",
                            invalid && "border-destructive/60 focus-visible:ring-destructive/20"
                          )}
                          disabled={isPreviewPending}
                          aria-label={`Product URL ${index + 1}`}
                        />
                        <div className="absolute inset-y-0 right-1 flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() => addUrlRow(row.id)}
                            disabled={isPreviewPending}
                            aria-label="Add URL row"
                          >
                            <Plus className="size-3.5" />
                          </Button>
                          {urlRows.length > 1 ? (
                            <Button
                              type="button"
                              size="icon-xs"
                              variant="ghost"
                              className="size-6 text-muted-foreground hover:text-destructive"
                              onClick={() => removeUrlRow(row.id)}
                              disabled={isPreviewPending}
                              aria-label="Remove URL row"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                      {invalid ? (
                        <p className="text-xs text-destructive">Enter a valid http/https URL.</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                className="h-11 w-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                disabled={!canReview}
                aria-busy={isPreviewPending ? true : undefined}
                onClick={reviewUrlRows}
              >
                {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Review Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!isSingleDraft ? (
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Shared Defaults
                  </p>
                  <div className="mt-2 grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">Mode</Label>
                      <TrackingModePicker
                        trackingMode={sharedTrackingMode}
                        setTrackingMode={setSharedTrackingMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">Check every</Label>
                      <AnimatedDropdown
                        options={intervalOptions}
                        value={sharedInterval}
                        onValueChange={setSharedInterval}
                        disabled={isSavePending || isPreviewPending}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Applies to ready rows that were not manually overridden.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-foreground">
                        Extra alerts
                      </Label>
                      <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-background/80 px-2.5 py-2 text-xs text-foreground">
                        <Checkbox
                          checked={sharedNotifyOnPriceIncrease}
                          onCheckedChange={(checked) =>
                            setSharedNotifyOnPriceIncrease(Boolean(checked))
                          }
                          disabled={isSavePending || isPreviewPending}
                        />
                        Notify on price increase
                      </Label>
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                className={cn(
                  "grid gap-3",
                  isSingleDraft
                    ? "md:grid-cols-1"
                    : "md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]"
                )}
              >
                {!isSingleDraft ? (
                  <div className="rounded-lg border border-border/70 bg-muted/10 p-2">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Items
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Selected {selectedReadyCount}
                      </p>
                    </div>
                    <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {drafts.map((draft, index) => {
                          const isActive = draft.clientId === activeDraftId;
                          const isReady = draft.previewStatus === "ready";
                          const domainLabel = getDomainLabel(draft.normalizedUrl);
                          return (
                            <motion.button
                              key={draft.clientId}
                              type="button"
                              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                              transition={
                                shouldReduceMotion
                                  ? { duration: 0 }
                                  : { duration: 0.18, delay: Math.min(index * 0.02, 0.16) }
                              }
                              onClick={() => setActiveDraft(draft.clientId)}
                              className={cn(
                                "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                                isActive
                                  ? "border-foreground/30 bg-background"
                                  : "border-border/60 bg-background/65 hover:bg-background"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={draft.selected}
                                  onCheckedChange={() => toggleDraftSelection(draft.clientId)}
                                  disabled={!isReady || draft.overLimit || isSavePending}
                                  className="mt-1"
                                  onClick={(event) => event.stopPropagation()}
                                />
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="truncate text-sm font-semibold text-foreground">
                                    {isReady
                                      ? draft.productName ?? draft.normalizedUrl
                                      : draft.rawUrl || "Untitled URL"}
                                  </p>
                                  <p className="truncate text-xs text-muted-foreground">{domainLabel}</p>
                                  {isReady ? (
                                    <p className="text-xs font-medium text-foreground/90">
                                      {formatPrice(draft.amount, draft.currency)}
                                    </p>
                                  ) : (
                                    <p className="truncate text-xs text-destructive">
                                      {draft.previewError ?? "Could not fetch this item."}
                                    </p>
                                  )}
                                  {draft.overLimit ? (
                                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                      Slot limit reached. Deselect another ready row first.
                                    </p>
                                  ) : null}
                                  {draft.submitError ? (
                                    <p className="text-[11px] text-destructive">{draft.submitError}</p>
                                  ) : null}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ) : null}

                <div
                  className={cn(
                    "rounded-lg border border-border/70 bg-muted/20",
                    isSingleDraft ? "p-4" : "p-3"
                  )}
                >
                  {!activeDraft ? (
                    <div className="grid min-h-[240px] place-items-center text-center">
                      <div className="space-y-2">
                        <CircleAlert className="mx-auto size-5 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">Select an item to configure.</p>
                      </div>
                    </div>
                  ) : activeDraft.previewStatus === "failed" ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Fix URL</p>
                        <p className="text-xs text-muted-foreground">
                          Update this URL and retry preview. Failed rows are excluded from send.
                        </p>
                      </div>

                      <Input
                        value={activeDraft.rawUrl}
                        onChange={(event) => setDraftRawUrl(activeDraft.clientId, event.target.value)}
                        placeholder="https://amazon.com/dp/..."
                        className="h-10"
                        disabled={isPreviewPending || isSavePending}
                      />

                      {activeDraft.previewError ? (
                        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
                          {activeDraft.previewError}
                        </p>
                      ) : null}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => retryDraftPreview(activeDraft.clientId)}
                        disabled={isPreviewPending || isSavePending}
                      >
                        {isPreviewPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
                        Retry Preview
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/35 p-2.5">
                        <div className="relative size-12 overflow-hidden rounded-md bg-background/80 dark:bg-muted/40">
                          {activeDraft.imageUrl ? (
                            <Image
                              src={activeDraft.imageUrl}
                              alt={activeDraft.productName ?? activeDraft.normalizedUrl}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {activeDraft.productName ?? activeDraft.normalizedUrl}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {getDomainLabel(activeDraft.normalizedUrl)}
                          </p>
                          <p className="text-xs font-medium text-foreground/90">
                            {formatPrice(activeDraft.amount, activeDraft.currency)}
                          </p>
                        </div>
                      </div>

                      <TrackingModePicker
                        trackingMode={activeDraft.trackingMode}
                        setTrackingMode={(value) => setDraftTrackingMode(activeDraft.clientId, value)}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-foreground">Target price</Label>
                          <CurrencyInput
                            currency={activeDraft.currency}
                            value={activeDraft.targetAmount}
                            onChange={(event) => setDraftTargetAmount(activeDraft.clientId, event.target.value)}
                            placeholder="84.99"
                            disabled={activeDraft.trackingMode === "monitor" || isSavePending}
                            className="h-10 border-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-foreground">Check every</Label>
                          <AnimatedDropdown
                            options={intervalOptions}
                            value={activeDraft.interval}
                            onValueChange={(value) => setDraftInterval(activeDraft.clientId, value)}
                            disabled={isSavePending}
                          />
                        </div>
                      </div>

                      <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-background/80 px-3 py-2 text-xs text-foreground">
                        <Checkbox
                          checked={activeDraft.notifyOnPriceIncrease}
                          onCheckedChange={(checked) =>
                            setDraftNotifyOnPriceIncrease(
                              activeDraft.clientId,
                              Boolean(checked)
                            )
                          }
                          disabled={isSavePending}
                        />
                        Notify when price increases
                      </Label>

                      {activeDraft.trackingMode === "monitor" ? (
                        <p className="text-xs text-muted-foreground">
                          {activeDraft.notifyOnPriceIncrease
                            ? "Price Drop mode ignores target price and notifies when prices move in either direction."
                            : "Price Drop mode ignores target price and only notifies when price decreases."}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Price Alert mode requires a positive target amount.
                        </p>
                      )}

                      {activeDraft.submitError ? (
                        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
                          {activeDraft.submitError}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {telegramConnected === false ? (
                <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="font-semibold">Telegram not connected</p>
                  <p className="mt-0.5">
                    Price-drop, price-increase, and tracking status alerts will not be delivered
                    until you link Telegram in Settings.
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {bulkResultSummary && modalStep === 2 ? (
            <p
              className={cn(
                "rounded-md border px-3 py-2 text-xs",
                bulkResultSummary.failureCount > 0
                  ? "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
                  : "border-emerald-300/50 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
              )}
            >
              {bulkResultSummary.failureCount > 0 ? (
                <>
                  {bulkResultSummary.successCount} tracker
                  {bulkResultSummary.successCount === 1 ? "" : "s"} created,{" "}
                  {bulkResultSummary.failureCount} failed. Fix the remaining rows and send again.
                </>
              ) : (
                <>
                  {bulkResultSummary.successCount} tracker
                  {bulkResultSummary.successCount === 1 ? "" : "s"} created successfully.
                </>
              )}
            </p>
          ) : null}

          {modalError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {modalError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-4">
          {modalStep === 2 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBackToUrlStep}
              disabled={isSavePending || isPreviewPending}
            >
              Back
            </Button>
          ) : (
            <div />
          )}
          {modalStep === 2 ? (
            <Button
              type="button"
              size="sm"
              className="px-4"
              onClick={saveTracker}
              disabled={!canSaveDrafts}
            >
              {isSavePending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Send {selectedReadyCount > 0 ? `(${selectedReadyCount})` : ""}
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}
