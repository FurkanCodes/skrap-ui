"use client";

import { useMemo, useState, useTransition } from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@/i18n/navigation";
import { isAppLocale, localizePathname } from "@/i18n/paths";

interface TrackResultPanelProps {
  url: string;
  siteKey: string | null;
  amount: string | null;
  currency: string | null;
  primarySeller?: string | null;
}

type TrackingMode = "monitor" | "alert";

const DEFAULT_TRACK_INTERVAL_VALUE = "60";

function mapActionError(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return fallback;
}

export function TrackResultPanel({
  url,
  siteKey,
  amount,
  currency,
  primarySeller = null,
}: TrackResultPanelProps) {
  const t = useTranslations("tracking.trackResult");
  const locale = useLocale();
  const { isAuthenticated, me } = useViewer();
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<TrackingMode>("monitor");
  const [targetAmount, setTargetAmount] = useState(amount ?? "");
  const [interval, setInterval] = useState(DEFAULT_TRACK_INTERVAL_VALUE);
  const [notifyOnPriceIncrease, setNotifyOnPriceIncrease] = useState(false);
  const [notifyOnStockChange, setNotifyOnStockChange] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modeOptions: Array<{ value: TrackingMode; label: string }> = [
    { value: "monitor", label: t("mode.monitor") },
    { value: "alert", label: t("mode.alert") },
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
          setError(t("errors.targetRequired"));
          return;
        }

        const response = (await createTrackedItemAction({
          url,
          sites: siteKey ? [siteKey] : undefined,
          fetch_mode: "auto",
          check_interval_minutes: parsedInterval,
          target_amount: targetRequired ? targetAmount.trim() : null,
          notify_on_price_increase: notifyOnPriceIncrease,
          notify_on_stock_change: notifyOnStockChange,
        })) as { item?: { item_id?: string } };

        let successMessage = targetRequired
          ? notifyOnPriceIncrease
            ? t("success.alertWithIncrease")
            : t("success.alert")
          : notifyOnPriceIncrease
            ? t("success.monitorWithIncrease")
            : t("success.monitor");
        if (notifyOnStockChange) {
          successMessage = `${successMessage} ${t("success.stockChange")}`;
        }

        if (response.item?.item_id) {
          setMessage(t("startedWithId", { itemId: response.item.item_id, detail: successMessage }));
        } else {
          setMessage(t("started", { detail: successMessage }));
        }
      } catch (actionError) {
        setError(mapActionError(actionError, t("errors.createFailed")));
      }
    });
  };

  const nextPath = localizePathname("/dashboard", isAppLocale(locale) ? locale : "en");

  return (
    <div className="grid gap-2 rounded-md border bg-muted/20 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{t("title")}</p>
        <SegmentedSwitch
          options={modeOptions}
          value={mode}
          onChange={setMode}
          ariaLabel={t("mode.ariaLabel")}
          disabled={isPending}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {primarySeller
          ? t("primaryOfferWithSeller", { seller: primarySeller })
          : t("primaryOffer")}
      </p>

      {!isAuthenticated ? (
        <p className="text-xs text-muted-foreground">
          {t("auth.description")}{" "}
          <Link
            href={`/auth/sign-in?next=${encodeURIComponent(nextPath)}`}
            className="underline underline-offset-4"
          >
            {t("auth.cta")}
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {targetRequired ? (
            <div className="grid gap-1">
              <Label htmlFor={`target-${url}`} className="text-[11px] text-muted-foreground">
                {t("fields.targetAmount")}
              </Label>
              <CurrencyInput
                id={`target-${url}`}
                currency={currency}
                value={targetAmount}
                onChange={(event) => setTargetAmount(event.target.value)}
                placeholder={t("fields.targetAmountPlaceholder")}
                disabled={isPending}
              />
            </div>
          ) : (
            <div className="grid gap-1">
              <Label className="text-[11px] text-muted-foreground">{t("fields.mode")}</Label>
              <Chip tone="subtle" className="w-fit">
                {t("mode.monitorHint")}
              </Chip>
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor={`interval-${url}`} className="text-[11px] text-muted-foreground">
              {t("fields.interval", { minInterval })}
            </Label>
            <Input
              id={`interval-${url}`}
              value={intervalValue}
              onChange={(event) => setInterval(event.target.value)}
              inputMode="numeric"
              disabled={isPending}
            />
          </div>

          <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-background/80 px-2.5 py-2 text-xs text-foreground md:col-span-2">
            <Checkbox
              checked={notifyOnPriceIncrease}
              onCheckedChange={(checked) => setNotifyOnPriceIncrease(Boolean(checked))}
              disabled={isPending}
            />
            {t("fields.notifyIncrease")}
          </Label>
          <Label className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border border-border/70 bg-background/80 px-2.5 py-2 text-xs text-foreground md:col-span-2">
            <Checkbox
              checked={notifyOnStockChange}
              onCheckedChange={(checked) => setNotifyOnStockChange(Boolean(checked))}
              disabled={isPending}
            />
            {t("fields.notifyStockChange")}
          </Label>

          <div className="flex items-end md:col-span-2 md:justify-end">
            <Button type="button" size="sm" disabled={!canSubmit || isPending} onClick={runTrack}>
          {isPending ? <IconLoader2 className="size-3.5 animate-spin" stroke={1.5} /> : null}
              {t("actions.trackItem")}
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
