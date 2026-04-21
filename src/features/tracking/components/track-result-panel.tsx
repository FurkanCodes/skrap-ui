"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SegmentedSwitch } from "@/features/tracking/components/trackers-dashboard/ui/segmented-switch";
import {
  getTrackIntervalValidationError,
  resolveEffectiveMinIntervalMinutes,
} from "@/features/tracking/interval-policy";
import { createTrackedItemAction } from "@/features/tracking/server/actions";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";

interface TrackResultPanelProps {
  url: string;
  siteKey: string | null;
  amount: string | null;
  currency: string | null;
  primarySeller?: string | null;
}

type TrackingMode = "monitor" | "alert";

const DEFAULT_TRACK_INTERVAL_VALUE = "60";

function mapActionError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Unable to create tracker. Please try again.";
}

export function TrackResultPanel({
  url,
  siteKey,
  amount,
  currency,
  primarySeller = null,
}: TrackResultPanelProps) {
  const { isAuthenticated, me } = useViewer();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<TrackingMode>("monitor");
  const [targetAmount, setTargetAmount] = useState(amount ?? "");
  const [interval, setInterval] = useState(DEFAULT_TRACK_INTERVAL_VALUE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modeOptions: Array<{ value: TrackingMode; label: string }> = [
    { value: "monitor", label: "Price Drop" },
    { value: "alert", label: "Price Alert" },
  ];

  const minInterval = useMemo(
    () =>
      resolveEffectiveMinIntervalMinutes({
        planKey: me?.entitlement?.plan_key,
        entitlementMinIntervalMinutes: Number(me?.entitlement?.min_check_interval_minutes),
      }),
    [me?.entitlement?.min_check_interval_minutes, me?.entitlement?.plan_key]
  );

  const intervalValue = useMemo(() => {
    const parsed = Number(interval);
    if (!Number.isInteger(parsed) || parsed < minInterval) {
      return String(minInterval);
    }
    return interval;
  }, [interval, minInterval]);

  const targetRequired = mode === "alert";
  const canSubmit = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!intervalValue.trim()) return false;
    if (targetRequired && !targetAmount.trim()) return false;
    return true;
  }, [intervalValue, isAuthenticated, targetRequired, targetAmount]);

  const runTrack = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const parsedInterval = Number(intervalValue);
        const intervalValidationError = getTrackIntervalValidationError(
          parsedInterval,
          minInterval
        );
        if (intervalValidationError) {
          setError(intervalValidationError);
          return;
        }

        if (targetRequired && !targetAmount.trim()) {
          setError("Target amount is required for Price Alert mode.");
          return;
        }

        const response = (await createTrackedItemAction({
          url,
          sites: siteKey ? [siteKey] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: targetRequired ? targetAmount.trim() : null,
        })) as { item?: { item_id?: string } };

        if (response.item?.item_id) {
          setMessage(
            targetRequired
              ? `Tracking started (${response.item.item_id}). We will notify you when price reaches your target.`
              : `Tracking started (${response.item.item_id}). We will notify you when price drops.`
          );
        } else {
          setMessage(
            targetRequired
              ? "Tracking started. We will notify you when price reaches your target."
              : "Tracking started. We will notify you when price drops."
          );
        }
      } catch (actionError) {
        setError(mapActionError(actionError));
      }
    });
  };

  return (
    <div className="grid gap-2 rounded-md border bg-muted/20 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">Tracking</p>
        <SegmentedSwitch
          options={modeOptions}
          value={mode}
          onChange={setMode}
          ariaLabel="Tracking mode"
          disabled={isPending}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Using primary offer for tracking{primarySeller ? ` (${primarySeller})` : ""}.
      </p>

      {!isAuthenticated ? (
        <p className="text-xs text-muted-foreground">
          Sign in to start tracking this product.{" "}
          <Link href="/auth/sign-in?next=/dashboard" className="underline underline-offset-4">
            Go to sign in
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          {targetRequired ? (
            <div className="grid gap-1">
              <Label htmlFor={`target-${url}`} className="text-[11px] text-muted-foreground">
                Target amount
              </Label>
              <CurrencyInput
                id={`target-${url}`}
                currency={currency}
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="45000.00"
                disabled={isPending}
              />
            </div>
          ) : (
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Mode</Label>
              <Chip tone="subtle" className="w-fit">
                Price-drop mode (no target)
              </Chip>
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor={`interval-${url}`} className="text-[11px] text-muted-foreground">
              Check interval (minutes, min {minInterval})
            </Label>
            <Input
              id={`interval-${url}`}
              value={intervalValue}
              onChange={(event) => setInterval(event.target.value)}
              inputMode="numeric"
              disabled={isPending}
            />
          </div>

          <div className="flex items-end">
            <Button type="button" size="sm" disabled={!canSubmit || isPending} onClick={runTrack}>
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Track item
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
      {message ? (
        <Chip tone="success" className="w-fit">
          {message}
        </Chip>
      ) : null}
    </div>
  );
}
