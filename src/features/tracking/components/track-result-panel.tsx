"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrackedItemAction } from "@/features/tracking/server/actions";
import { useViewer } from "@/features/tracking/viewer/viewer-provider";
import { authClient } from "@/lib/auth-client";

interface TrackResultPanelProps {
  url: string;
  siteKey: string | null;
  amount: string | null;
}

type TrackingMode = "monitor" | "alert";

const MIN_BACKEND_CHECK_INTERVAL_MINUTES = 1;
const MAX_BACKEND_CHECK_INTERVAL_MINUTES = 10080;
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

export function TrackResultPanel({ url, siteKey, amount }: TrackResultPanelProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { me } = useViewer();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<TrackingMode>("monitor");
  const [targetAmount, setTargetAmount] = useState(amount ?? "");
  const [interval, setInterval] = useState(DEFAULT_TRACK_INTERVAL_VALUE);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const minInterval = useMemo(() => {
    const entitlementMin = Number(me?.entitlement?.min_check_interval_minutes);
    if (!Number.isInteger(entitlementMin)) {
      return MIN_BACKEND_CHECK_INTERVAL_MINUTES;
    }
    return Math.max(entitlementMin, MIN_BACKEND_CHECK_INTERVAL_MINUTES);
  }, [me?.entitlement?.min_check_interval_minutes]);

  const intervalValue = useMemo(() => {
    const parsed = Number(interval);
    if (!Number.isInteger(parsed) || parsed < minInterval) {
      return String(minInterval);
    }
    return interval;
  }, [interval, minInterval]);

  const targetRequired = mode === "alert";
  const canSubmit = useMemo(() => {
    if (sessionPending || !session?.user) return false;
    if (!intervalValue.trim()) return false;
    if (targetRequired && !targetAmount.trim()) return false;
    return true;
  }, [sessionPending, session?.user, intervalValue, targetRequired, targetAmount]);

  const runTrack = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const parsedInterval = Number(intervalValue);
        if (
          !Number.isInteger(parsedInterval) ||
          parsedInterval < minInterval ||
          parsedInterval > MAX_BACKEND_CHECK_INTERVAL_MINUTES
        ) {
          setError(
            `Interval must be an integer between ${minInterval} and ${MAX_BACKEND_CHECK_INTERVAL_MINUTES}. Temporary mode: 1-59 = seconds, 60+ = minutes.`
          );
          return;
        }

        if (targetRequired && !targetAmount.trim()) {
          setError("Target amount is required for alert mode.");
          return;
        }

        const response = (await createTrackedItemAction({
          url,
          sites: siteKey ? [siteKey] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: targetRequired ? targetAmount.trim() : null,
        })) as { item?: { item_id?: string } };

        setMessage(response.item?.item_id ? `Tracking started (${response.item.item_id}).` : "Tracking started.");
      } catch (actionError) {
        setError(mapActionError(actionError));
      }
    });
  };

  return (
    <div className="grid gap-2 rounded-md border bg-muted/20 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">Tracking</p>
        <div className="flex gap-1">
          <Button
            type="button"
            size="xs"
            variant={mode === "monitor" ? "secondary" : "outline"}
            onClick={() => setMode("monitor")}
            disabled={isPending}
          >
            Monitor
          </Button>
          <Button
            type="button"
            size="xs"
            variant={mode === "alert" ? "secondary" : "outline"}
            onClick={() => setMode("alert")}
            disabled={isPending}
          >
            Alert
          </Button>
        </div>
      </div>

      {!session?.user ? (
        <p className="text-xs text-muted-foreground">
          Sign in to start tracking this product.{" "}
          <Link href="/auth/sign-in?next=/" className="underline underline-offset-4">
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
              <Input
                id={`target-${url}`}
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder="45000.00"
                disabled={isPending}
              />
            </div>
          ) : (
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">Mode</Label>
              <div className="inline-flex h-8 items-center rounded-md border px-2 text-xs text-muted-foreground">
                No target needed
              </div>
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor={`interval-${url}`} className="text-[11px] text-muted-foreground">
              Check interval (temp: 1-59 sec, 60+ min, min {minInterval})
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
        <Badge variant="secondary" className="w-fit">
          {message}
        </Badge>
      ) : null}
    </div>
  );
}
