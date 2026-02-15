import { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type AnimatedIconProps = ComponentProps<"div">

export function AnimatedIcon({ children, className, ...props }: AnimatedIconProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
