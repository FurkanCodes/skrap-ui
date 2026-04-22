"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

interface LiveNumberTickerProps {
  value: number;
  decimals?: number;
  live?: boolean;
  className?: string;
  label?: string;
  locale?: string;
}

function isDigit(value: string): boolean {
  return value >= "0" && value <= "9";
}

function RollingDigit({
  value,
  reduceMotion,
}: {
  value: string;
  reduceMotion: boolean;
}) {
  const transition = reduceMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 230,
        damping: 24,
        mass: 0.7,
      };

  if (!isDigit(value)) {
    return (
      <span className="inline-flex w-[0.32em] items-center justify-center tabular-nums">
        {value}
      </span>
    );
  }

  return (
    <span className="relative inline-flex h-[1em] w-[0.62em] items-center justify-center overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={reduceMotion ? { opacity: 1, y: "0%" } : { opacity: 0, y: "58%" }}
          animate={{ opacity: 1, y: "0%" }}
          exit={reduceMotion ? { opacity: 1, y: "0%" } : { opacity: 0, y: "-58%" }}
          transition={transition}
          className="absolute inset-0 inline-flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function LiveNumberTicker({
  value,
  decimals = 0,
  live = false,
  className,
  label,
  locale = "en-US",
}: LiveNumberTickerProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals, locale]
  );
  const formattedValue = formatter.format(value);
  const slots = useMemo(
    () =>
      Array.from(formattedValue).map((char, index, all) => ({
        char,
        // Right-aligned slot id keeps stable positions for the least-significant digits.
        slotId: all.length - 1 - index,
      })),
    [formattedValue]
  );

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {live ? (
        <span className="relative inline-flex size-2.5 shrink-0">
          <span className="absolute inset-0 inline-flex animate-ping rounded-full bg-emerald-400/80" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
      ) : null}
      <span className="inline-flex items-center tabular-nums">
        {slots.map(({ char, slotId }) => (
          <RollingDigit key={slotId} value={char} reduceMotion={shouldReduceMotion} />
        ))}
      </span>
      {label ? <span className="text-sm font-medium text-muted-foreground">{label}</span> : null}
    </span>
  );
}
