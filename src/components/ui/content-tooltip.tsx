"use client";

import { InfoIcon } from "lucide-react";

import { TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ContentTooltipProps {
  title?: string;
  description: string;
  className?: string;
}

export function ContentTooltip({
  title,
  description,
  className,
}: ContentTooltipProps) {
  return (
    <TooltipContent className={cn("max-w-64 py-3 text-pretty", className)}>
      <div className="space-y-1">
        {title ? (
          <div className="flex items-center gap-2">
            <InfoIcon className="size-4" />
            <p className="text-sm font-medium">{title}</p>
          </div>
        ) : null}
        <p className={title ? "text-background/80" : "text-background/90"}>
          {description}
        </p>
      </div>
    </TooltipContent>
  );
}
