import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      tone: {
        selected: "bg-background text-foreground shadow-sm",
        muted: "bg-muted/35 text-muted-foreground",
        subtle: "bg-card/70 text-muted-foreground",
        success: "bg-emerald-500/12 text-emerald-200",
        danger: "bg-destructive/12 text-destructive",
      },
      size: {
        sm: "h-6 px-2.5 text-[11px]",
        md: "h-8 px-3 text-sm",
      },
    },
    defaultVariants: {
      tone: "muted",
      size: "sm",
    },
  }
);

type ChipProps = ComponentPropsWithoutRef<"span"> & VariantProps<typeof chipVariants>;

function Chip({ className, tone, size, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ tone, size }), className)} {...props} />;
}

export { Chip, chipVariants };
