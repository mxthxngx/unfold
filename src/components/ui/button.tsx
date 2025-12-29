import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-button-ring focus-visible:ring-button focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-button text-button border border-button hover:bg-button-hover",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-[#202023] text-[#c0c0c5] border border-[#2a2a2d] hover:bg-[#252528] hover:border-[#303033] transition-all duration-200",
        outline_destructive:
          "text-white-400/50 border border-red-500/5 bg-red-500/60 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30 hover:shadow-[inset_0_0_8px_rgba(239,68,68,0.1)] transition-all duration-200",
        secondary:
          "hover:bg-sidebar-item-hover-bg/85 bg-sidebar-item-hover-bg/50 text-sidebar-foreground hover:text-white data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]",
        ghost:
          "bg-button-ghost text-button hover:bg-button-hover",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
