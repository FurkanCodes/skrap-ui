import { IconCircleCheck } from "@tabler/icons-react";

import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

interface TelegramStatusChipProps {
  connected: boolean | null;
  connectedLabel: string;
  disconnectedLabel: string;
  pendingLabel?: string;
  className?: string;
}

export function TelegramStatusChip({
  connected,
  connectedLabel,
  disconnectedLabel,
  pendingLabel,
  className,
}: TelegramStatusChipProps) {
  if (connected === true) {
    return (
      <Chip
        tone="success"
        className={cn(
          "rounded-full bg-emerald-500/14 text-emerald-700 ring-1 ring-emerald-500/25 dark:bg-emerald-500/22 dark:text-emerald-200 dark:ring-emerald-400/30",
          className
        )}
      >
        <IconCircleCheck
          className="size-3.5 text-emerald-600 dark:text-emerald-300"
          stroke={1.5}
        />
        <span>{connectedLabel}</span>
      </Chip>
    );
  }

  const label = connected === null && pendingLabel ? pendingLabel : disconnectedLabel;

  return (
    <Chip
      tone="muted"
      className={cn(
        "rounded-full bg-muted/55 text-muted-foreground ring-1 ring-border/70 dark:bg-muted/30",
        className
      )}
    >
      {label}
    </Chip>
  );
}
