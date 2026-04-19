"use client";

import Image from "next/image";

import { formatPrice } from "@/features/tracking/components/trackers-dashboard/utils";
import type { TrackedItemPreview } from "@/features/tracking/types";

export function PreviewCard({ preview }: { preview: TrackedItemPreview }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-3">
        <div className="relative size-14 overflow-hidden rounded-lg border border-border/70 bg-zinc-100">
          {preview.image_url ? (
            <Image
              src={preview.image_url}
              alt={preview.product_name}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm font-semibold text-zinc-500">
              {preview.product_name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-1 text-sm font-semibold text-foreground">{preview.product_name}</p>
          <p className="text-base font-bold text-foreground">
            {formatPrice(preview.amount, preview.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
