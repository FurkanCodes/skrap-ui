"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, PauseCircle, PlayCircle, RefreshCw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteTrackedItemAction,
  pauseTrackedItemAction,
  resumeTrackedItemAction,
} from "@/features/tracking/server/actions";
import type { TrackedItemSummary } from "@/features/tracking/types";

interface TrackedItemsPanelClientProps {
  isAuthenticated: boolean;
  initialItems: TrackedItemSummary[];
  initialError: string | null;
}

function mapError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybe = error as { message?: unknown };
    if (typeof maybe.message === "string" && maybe.message.trim()) {
      return maybe.message;
    }
  }
  return "Request failed.";
}

function formatAmount(item: TrackedItemSummary): string {
  if (!item.last_amount) return "-";
  return `${item.last_amount} ${item.currency ?? ""}`.trim();
}

function formatInterval(value: number): string {
  if (value < 60) {
    return `${value}s`;
  }
  return `${value}m`;
}

export function TrackedItemsPanelClient({
  isAuthenticated,
  initialItems,
  initialError,
}: TrackedItemsPanelClientProps) {
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isRefreshPending, startRefreshTransition] = useTransition();
  const displayError = actionError ?? initialError;

  const summary = useMemo(() => {
    const active = initialItems.filter((item) => item.status === "active").length;
    return { total: initialItems.length, active };
  }, [initialItems]);

  const refresh = () => {
    setActionError(null);
    setBusyItemId(null);
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const runItemAction = (itemId: string, action: "pause" | "resume" | "delete") => {
    if (isActionPending || isRefreshPending) {
      return;
    }
    setBusyItemId(itemId);
    setActionError(null);
    setIsActionPending(true);
    void (async () => {
      try {
        if (action === "pause") {
          await pauseTrackedItemAction(itemId);
        } else if (action === "resume") {
          await resumeTrackedItemAction(itemId);
        } else {
          await deleteTrackedItemAction(itemId);
        }
      } catch (actionError) {
        setActionError(mapError(actionError));
      } finally {
        setBusyItemId(null);
        setIsActionPending(false);
      }
    })();
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My tracked items</CardTitle>
          <CardDescription>
            Sign in to see your private tracked products and control monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in?next=/" className={buttonVariants({ size: "sm" })}>
            Sign in to manage tracking
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>My tracked items</CardTitle>
          <CardDescription>
            Total {summary.total} • Active {summary.active}
          </CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={refresh}
          disabled={isRefreshPending || isActionPending}
        >
          {isRefreshPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="grid gap-2">
        {displayError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {displayError}
          </p>
        ) : null}

        {initialItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have tracked items yet. Run a scrape and click <strong>Track item</strong>.
          </p>
        ) : (
          initialItems.map((item) => {
            const busy = isActionPending && busyItemId === item.item_id;
            return (
              <div
                key={item.item_id}
                className="grid gap-2 rounded-md border bg-muted/10 px-3 py-2 md:grid-cols-[1fr_auto]"
              >
                <div className="space-y-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.product_name ?? item.source_url}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{item.source_url}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={item.status === "active" ? "secondary" : "outline"}>{item.status}</Badge>
                    <Badge variant="outline">{item.tracking_mode}</Badge>
                    <Badge variant="outline">Every {formatInterval(item.check_interval_minutes)}</Badge>
                    <Badge variant="outline">{formatAmount(item)}</Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {item.status === "active" ? (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => runItemAction(item.item_id, "pause")}
                      disabled={busy || isRefreshPending}
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <PauseCircle className="size-3.5" />
                      )}
                      Pause
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => runItemAction(item.item_id, "resume")}
                      disabled={busy || isRefreshPending}
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <PlayCircle className="size-3.5" />
                      )}
                      Resume
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="xs"
                    variant="destructive"
                    onClick={() => runItemAction(item.item_id, "delete")}
                    disabled={busy || isRefreshPending}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
