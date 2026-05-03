"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BillingPortalResponse } from "@/features/billing/types";

interface ManageBillingButtonProps {
  label: string;
}

export function ManageBillingButton({ label }: ManageBillingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-9 rounded-lg border-border bg-background"
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const response = await fetch("/api/billing/portal", {
                method: "POST",
                credentials: "include",
              });
              const payload = await readJson(response);
              if (!response.ok || !isPortalResponse(payload)) {
                throw new Error(readError(payload, "Could not open billing portal."));
              }
              window.location.assign(payload.url);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not open billing portal.");
            }
          });
        }}
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
        {label}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isPortalResponse(value: unknown): value is BillingPortalResponse {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { url?: unknown }).url === "string"
  );
}

function readError(value: unknown, fallback: string): string {
  if (value && typeof value === "object") {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }
  return fallback;
}
