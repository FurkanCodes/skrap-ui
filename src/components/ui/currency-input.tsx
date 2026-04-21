"use client";

import type { ComponentPropsWithoutRef } from "react";
import { DollarSign } from "lucide-react";

import { Input } from "@/components/ui/input";
import { getCurrencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<ComponentPropsWithoutRef<typeof Input>, "type"> {
  currency: string | null | undefined;
}

export function CurrencyInput({ className, currency, ...props }: CurrencyInputProps) {
  const symbol = getCurrencySymbol(currency);

  return (
    <div className="relative">
      {symbol ? (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
          {symbol}
        </span>
      ) : (
        <DollarSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="text"
        inputMode="decimal"
        className={cn("bg-background/80 pl-9 dark:bg-muted/30", className)}
        {...props}
      />
    </div>
  );
}
