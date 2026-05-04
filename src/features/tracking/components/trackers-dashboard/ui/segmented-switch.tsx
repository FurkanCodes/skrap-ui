"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";

import { ContentTooltip } from "@/components/ui/content-tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SegmentedSwitchOption<T extends string> {
  value: T;
  label: string;
  tooltip?: {
    title?: string;
    description: string;
  };
}

interface SegmentedSwitchProps<T extends string> {
  options: ReadonlyArray<SegmentedSwitchOption<T>>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  fullWidth = false,
  className,
}: SegmentedSwitchProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const highlightId = useId();

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/70 bg-background p-1",
        disabled && "opacity-60",
        fullWidth && "w-full",
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const optionButton = (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative inline-flex h-7 items-center justify-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              "disabled:pointer-events-none",
              fullWidth && "flex-1",
              isSelected ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isSelected ? (
              <motion.span
                layoutId={shouldReduceMotion ? undefined : `${highlightId}-switch-highlight`}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34, mass: 0.6 }
                }
                className="pointer-events-none absolute inset-0 rounded-full bg-muted shadow-[0_1px_1px_rgb(24_25_37_/_0.04)]"
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );

        if (!option.tooltip) {
          return optionButton;
        }

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger render={optionButton} />
            <ContentTooltip
              title={option.tooltip.title}
              description={option.tooltip.description}
            />
          </Tooltip>
        );
      })}
    </div>
  );
}
