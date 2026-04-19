"use client";

interface SummaryBarProps {
  active: number;
  alerts: number;
  saved: number;
}

export function SummaryBar({ active, alerts, saved }: SummaryBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">
        Active <strong className="text-foreground">{active}</strong>
      </span>
      <span className="text-muted-foreground">
        Alerts <strong className="text-foreground">{alerts}</strong>
      </span>
      <span className="text-muted-foreground">
        Saved <strong className="text-foreground">${Math.round(saved)}</strong>
      </span>
    </div>
  );
}
