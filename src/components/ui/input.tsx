import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-transparent bg-bg-2 px-4 py-1 text-base font-medium text-fg-4 backdrop-blur-md transition-all outline-2 outline-transparent file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-fg-4 placeholder:text-fg-1 focus:outline-purple-4 focus:ring-2 focus:ring-purple-2 focus-visible:outline-purple-4 focus-visible:ring-2 focus-visible:ring-purple-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:outline-destructive/70 aria-invalid:ring-2 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
