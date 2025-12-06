import * as motion from "motion/react-client"
import { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type AnimatedIconProps = ComponentProps<typeof motion.div>

export function AnimatedIcon({ children, className, ...props }: AnimatedIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.3 }}
      className={cn(
        "inline-flex items-center justify-center text-sidebar-foreground hover:text-sidebar-accent-foreground transition-transform transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
