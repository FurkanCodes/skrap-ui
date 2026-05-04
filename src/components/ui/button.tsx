import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:not-aria-[haspopup]:scale-[0.99] data-[pressed]:scale-[0.99] disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:focus-visible:ring-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 disabled:[&_svg]:opacity-30",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-[0_1px_1px_rgb(24_25_37_/_0.08),0_0_0_0.5px_rgb(24_25_37_/_0.06)] hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground",
        outline:
          "border-border/70 bg-background text-foreground shadow-[0_1px_1px_rgb(24_25_37_/_0.04)] hover:bg-muted/55 disabled:bg-muted disabled:text-muted-foreground aria-expanded:bg-muted/70",
        secondary:
          "bg-muted text-foreground hover:bg-muted/75 disabled:bg-muted disabled:text-muted-foreground aria-expanded:bg-muted/80",
        ghost:
          "bg-transparent text-foreground hover:bg-muted/60 disabled:bg-transparent disabled:text-muted-foreground aria-expanded:bg-muted/70",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:ring-destructive/20 disabled:bg-destructive/10 disabled:text-destructive/40 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
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
