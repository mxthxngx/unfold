import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-foreground/10 before:to-transparent",
        "before:animate-skeleton-shimmer motion-reduce:before:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
