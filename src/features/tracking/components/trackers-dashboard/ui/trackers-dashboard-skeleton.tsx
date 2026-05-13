import { Skeleton } from "@/components/ui/skeleton";

function SkeletonLine({ className }: { className: string }) {
  return <Skeleton className={`motion-reduce:animate-none ${className}`} />;
}

function SummaryMetricSkeleton({ width }: { width: string }) {
  return (
    <div className="min-w-0 space-y-2">
      <SkeletonLine className="h-2.5 w-20 rounded-full bg-muted" />
      <SkeletonLine className={`h-4 rounded-full bg-bg-2 ${width}`} />
    </div>
  );
}

function TrackerRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <article className="grid gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-[0_1px_1px_rgb(24_25_37_/_0.03)] md:grid-cols-[minmax(0,1fr)_172px]">
      <div className="flex gap-3">
        <SkeletonLine className="size-16 shrink-0 rounded-lg bg-muted" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <SkeletonLine className="h-5 w-20 rounded-md bg-muted" />
            <SkeletonLine className="h-5 w-12 rounded-full bg-muted" />
            <SkeletonLine className="h-5 w-20 rounded-full bg-muted" />
            {!compact ? <SkeletonLine className="h-5 w-24 rounded-full bg-muted" /> : null}
          </div>

          <SkeletonLine
            className={
              compact
                ? "h-4 w-[min(66%,22rem)] rounded-full bg-bg-2"
                : "h-4 w-[min(82%,30rem)] rounded-full bg-bg-2"
            }
          />

          <div className="flex flex-wrap items-end gap-2">
            <SkeletonLine className="h-7 w-28 rounded-full bg-bg-2" />
            {!compact ? <SkeletonLine className="h-3 w-24 rounded-full bg-muted" /> : null}
          </div>

          {!compact ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <SkeletonLine className="h-2.5 w-16 rounded-full bg-muted" />
                <SkeletonLine className="h-2.5 w-24 rounded-full bg-muted" />
                <SkeletonLine className="h-2.5 w-16 rounded-full bg-muted" />
              </div>
              <SkeletonLine className="h-1.5 w-full rounded-full bg-muted" />
            </div>
          ) : null}

          <SkeletonLine className="h-3 w-[min(72%,24rem)] rounded-full bg-muted" />
        </div>
      </div>

      <div className="flex items-start justify-end gap-1.5">
        <SkeletonLine className="size-8 rounded-md bg-muted" />
        <SkeletonLine className="size-8 rounded-md bg-muted" />
        <SkeletonLine className="size-8 rounded-md bg-muted" />
        <SkeletonLine className="size-8 rounded-md bg-muted" />
      </div>
    </article>
  );
}

export function TrackersDashboardSkeleton() {
  return (
    <section
      className="space-y-4 md:space-y-5"
      aria-busy="true"
      aria-label="Loading tracker dashboard"
      role="status"
    >
      <div className="space-y-2" aria-hidden="true">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SkeletonLine className="h-8 w-36 rounded-full bg-bg-2" />
          <SkeletonLine className="h-8 w-24 rounded-full bg-bg-2" />
          <SkeletonLine className="h-8 w-32 rounded-full bg-bg-2" />
        </div>
      </div>

      <div
        className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_1px_1px_rgb(24_25_37_/_0.03)] sm:p-5"
        aria-hidden="true"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] lg:items-end">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-2.5">
                <SkeletonLine className="h-3 w-32 rounded-full bg-muted" />
                <div className="flex items-end gap-2">
                  <SkeletonLine className="h-8 w-32 rounded-full bg-bg-2" />
                  <SkeletonLine className="mb-1 h-4 w-20 rounded-full bg-muted" />
                </div>
              </div>
              <SkeletonLine className="h-6 w-36 rounded-full bg-muted" />
            </div>
            <SkeletonLine className="h-1.5 w-full rounded-full bg-muted" />
          </div>

          <dl className="grid gap-4 sm:grid-cols-3">
            <SummaryMetricSkeleton width="w-16" />
            <SummaryMetricSkeleton width="w-20" />
            <SummaryMetricSkeleton width="w-12" />
          </dl>
        </div>

        <div className="mt-4 flex flex-wrap gap-1">
          <SkeletonLine className="h-3 w-24 rounded-full bg-muted" />
          <SkeletonLine className="h-3 w-20 rounded-full bg-muted" />
        </div>
      </div>

      <div className="space-y-2.5" aria-hidden="true">
        <div className="relative min-w-0">
          <SkeletonLine className="h-10 w-full rounded-lg bg-muted" />
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonLine className="h-3 w-12 rounded-full bg-muted" />
            <div className="flex gap-1 rounded-full bg-muted/45 p-1">
              <SkeletonLine className="h-7 w-14 rounded-full bg-bg-2" />
              <SkeletonLine className="h-7 w-16 rounded-full bg-bg-2" />
              <SkeletonLine className="h-7 w-16 rounded-full bg-bg-2" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonLine className="h-3 w-10 rounded-full bg-muted" />
            <div className="flex gap-1 rounded-full bg-muted/45 p-1">
              <SkeletonLine className="h-7 w-14 rounded-full bg-bg-2" />
              <SkeletonLine className="h-7 w-24 rounded-full bg-bg-2" />
              <SkeletonLine className="h-7 w-24 rounded-full bg-bg-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3" aria-hidden="true">
        <TrackerRowSkeleton />
        <TrackerRowSkeleton compact />
        <TrackerRowSkeleton />
      </div>
    </section>
  );
}
