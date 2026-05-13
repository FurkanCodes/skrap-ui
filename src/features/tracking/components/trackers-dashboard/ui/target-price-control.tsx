"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPrice,
  parseNumberish,
} from "@/features/tracking/components/trackers-dashboard/utils";
import { cn } from "@/lib/utils";

type TargetPriceMode = "amount" | "percent";

interface TargetPriceControlProps {
  id: string;
  label: string;
  currency: string | null;
  baseAmount: string | null;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  percentEnabled?: boolean;
  className?: string;
}

const DEFAULT_PERCENT = "10";

function normalizePercentInput(value: string): string {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const [whole = "", ...fractionParts] = normalized.split(".");
  const fraction = fractionParts.join("").slice(0, 2);

  if (fractionParts.length > 0) {
    return `${whole.slice(0, 3)}.${fraction}`;
  }

  return whole.slice(0, 3);
}

function getPercentTarget(baseAmount: number | null, percentValue: string): string | null {
  const percent = parseNumberish(percentValue);

  if (
    baseAmount === null ||
    baseAmount <= 0 ||
    percent === null ||
    percent <= 0 ||
    percent >= 100
  ) {
    return null;
  }

  return (baseAmount * (1 - percent / 100)).toFixed(2);
}

export function TargetPriceControl({
  id,
  label,
  currency,
  baseAmount,
  value,
  onValueChange,
  disabled = false,
  percentEnabled = true,
  className,
}: TargetPriceControlProps) {
  const [mode, setMode] = useState<TargetPriceMode>("amount");
  const [percent, setPercent] = useState(DEFAULT_PERCENT);
  const onValueChangeRef = useRef(onValueChange);

  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  const baseNumber = useMemo(() => parseNumberish(baseAmount), [baseAmount]);
  const canUsePercent = baseNumber !== null && baseNumber > 0;
  const activeMode =
    mode === "percent" && canUsePercent && percentEnabled ? "percent" : "amount";
  const targetFromPercent = useMemo(
    () => getPercentTarget(baseNumber, percent),
    [baseNumber, percent]
  );
  const formattedBaseAmount = canUsePercent
    ? formatPrice(baseAmount, currency)
    : null;

  const percentNumber = parseNumberish(percent);
  const hasPercentValue = percent.trim().length > 0;
  const hasInvalidPercent =
    activeMode === "percent" &&
    hasPercentValue &&
    (percentNumber === null || percentNumber <= 0 || percentNumber >= 100);

  useEffect(() => {
    if (activeMode !== "percent") {
      return;
    }

    const nextValue = targetFromPercent ?? "";
    if (value !== nextValue) {
      onValueChangeRef.current(nextValue);
    }
  }, [activeMode, targetFromPercent, value]);

  const activateAmountMode = useCallback(() => {
    setMode("amount");
  }, []);

  const activatePercentMode = useCallback(() => {
    if (!canUsePercent || disabled || !percentEnabled) {
      return;
    }

    const nextPercent = percent.trim() ? percent : DEFAULT_PERCENT;
    if (nextPercent !== percent) {
      setPercent(nextPercent);
    }

    setMode("percent");
    onValueChange(getPercentTarget(baseNumber, nextPercent) ?? "");
  }, [baseNumber, canUsePercent, disabled, onValueChange, percent, percentEnabled]);

  const handlePercentChange = useCallback((nextValue: string) => {
    setPercent(normalizePercentInput(nextValue));
  }, []);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor={activeMode === "amount" ? id : `${id}-percent`}
          className="text-xs font-semibold text-foreground"
        >
          {label}
        </Label>
        {formattedBaseAmount ? (
          <span className="min-w-0 truncate text-[11px] font-medium text-muted-foreground">
            Base {formattedBaseAmount}
          </span>
        ) : null}
      </div>

      <div className="rounded-lg border border-border/70 bg-muted/20 p-1">
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={activateAmountMode}
            disabled={disabled}
            aria-pressed={activeMode === "amount"}
            className={cn(
              "h-8 rounded-md text-xs font-semibold text-muted-foreground transition-colors",
              "hover:bg-background/75 hover:text-foreground disabled:pointer-events-none disabled:opacity-60",
              activeMode === "amount" && "bg-background text-foreground shadow-xs"
            )}
          >
            Price
          </button>
          <button
            type="button"
            onClick={activatePercentMode}
            disabled={disabled || !canUsePercent || !percentEnabled}
            aria-pressed={activeMode === "percent"}
            className={cn(
              "h-8 rounded-md text-xs font-semibold text-muted-foreground transition-colors",
              "hover:bg-background/75 hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
              activeMode === "percent" && "bg-background text-foreground shadow-xs"
            )}
          >
            % drop
          </button>
        </div>

        <div className="mt-2">
          {activeMode === "amount" ? (
            <CurrencyInput
              id={id}
              currency={currency}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              placeholder="84.99"
              disabled={disabled}
              className="h-10 border-input"
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(8rem,auto)]">
              <div>
                <div className="relative">
                  <Input
                    id={`${id}-percent`}
                    type="text"
                    inputMode="decimal"
                    value={percent}
                    onChange={(event) => handlePercentChange(event.target.value)}
                    disabled={disabled}
                    className={cn(
                      "h-10 bg-background/80 pr-8 dark:bg-muted/30",
                      hasInvalidPercent && "border-destructive/60 focus-visible:ring-destructive/20"
                    )}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1.5 text-[11px] leading-snug text-muted-foreground",
                    hasInvalidPercent && "text-destructive"
                  )}
                >
                  {hasInvalidPercent
                    ? "Use 1-99%"
                    : formattedBaseAmount
                      ? `Based on ${formattedBaseAmount}`
                      : "Detected price needed"}
                </p>
              </div>
              <div className="flex h-10 items-center justify-between gap-3 rounded-md border border-border/60 bg-background/70 px-3 text-xs">
                <span className="text-muted-foreground">Target</span>
                <span className="font-semibold text-foreground">
                  {targetFromPercent ? formatPrice(targetFromPercent, currency) : "Set percent"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
