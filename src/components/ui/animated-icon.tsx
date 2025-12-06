import * as motion from "motion/react-client"
import { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type AnimatedIconProps = ComponentProps<typeof motion.div>

export function AnimatedIcon({ children, className, ...props }: AnimatedIconProps) {
  return (
    <motion.div
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className={cn("text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors", className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
