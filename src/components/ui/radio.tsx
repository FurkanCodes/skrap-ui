import * as React from "react"

import { cn } from "@/lib/utils"

function Radio({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      data-slot="radio"
      className={cn(
        "relative size-4 shrink-0 appearance-none rounded-full border border-border bg-background transition-colors outline-none after:absolute after:left-1/2 after:top-1/2 after:size-1.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-background after:opacity-0 after:content-[''] hover:border-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 checked:border-foreground checked:bg-foreground checked:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

export { Radio }
