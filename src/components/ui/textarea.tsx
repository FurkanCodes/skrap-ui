import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-transparent bg-bg-2 px-4 py-2 text-base font-medium text-fg-4 backdrop-blur-md transition-all outline-2 outline-transparent placeholder:text-fg-1 focus:outline-purple-4 focus:ring-2 focus:ring-purple-2 focus-visible:outline-purple-4 focus-visible:ring-2 focus-visible:ring-purple-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:outline-destructive/70 aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
