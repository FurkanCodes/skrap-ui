import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-purple-2 focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none active:not-aria-[haspopup]:scale-[0.99] data-[pressed]:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:focus-visible:ring-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 disabled:[&_svg]:opacity-30",
  {
    variants: {
      variant: {
        default:
          "bg-bg-a1 text-fg-3 hover:bg-bg-a2 hover:text-fg-3 disabled:bg-bg-2 disabled:text-fg-a1/50 dark:bg-bg-a3 dark:hover:bg-bg-a4",
        outline:
          "bg-bg-a1 text-fg-3 hover:bg-bg-a2 hover:text-fg-3 disabled:bg-bg-2 disabled:text-fg-a1/50 aria-expanded:bg-bg-a2 aria-expanded:text-fg-3 dark:bg-bg-a3 dark:hover:bg-bg-a4",
        secondary:
          "bg-bg-a1 text-fg-3 hover:bg-bg-a2 hover:text-fg-3 disabled:bg-bg-2 disabled:text-fg-a1/50 aria-expanded:bg-bg-a2 aria-expanded:text-fg-3 dark:bg-bg-a3 dark:hover:bg-bg-a4",
        ghost:
          "bg-transparent text-fg-3 hover:bg-bg-a2 hover:text-fg-3 disabled:bg-transparent disabled:text-fg-a1/50 aria-expanded:bg-bg-a2 aria-expanded:text-fg-3 dark:hover:bg-bg-a4",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 disabled:bg-destructive/10 disabled:text-destructive/40 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-7 gap-1 px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11 px-0",
        "icon-xs":
          "size-7 px-0 in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 px-0 in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
