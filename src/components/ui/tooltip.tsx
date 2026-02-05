import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root> & {
  delayDuration?: number
}

function Tooltip({
  delayDuration,
  ...props
}: TooltipProps) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
  showArrow?: boolean
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  showArrow = true,
  ...props
}: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-tooltip text-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-2.5 py-1 text-xs text-balance shadow-lg backdrop-blur-sm border border-border",
          className
        )}
        {...props}
      >
        {children}
        {showArrow && <TooltipPrimitive.Arrow className="fill-tooltip z-50" />}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

type AppTooltipContentProps = TooltipContentProps & {
  label?: string
  shortcut?: string
}

/**
 * App-wide default tooltip styling helper to keep consistent tone/spacing.
 */
function AppTooltipContent({
  label,
  shortcut,
  children,
  className,
  side = "bottom",
  sideOffset = 6,
  showArrow = false,
  ...props
}: AppTooltipContentProps) {
  return (
    <TooltipContent
      side={side}
      sideOffset={sideOffset}
      showArrow={showArrow}
      className={cn(
        "bg-tooltip text-foreground border border-border shadow-[var(--shadow-tooltip)]",
        className
      )}
      {...props}
    >
      <div className="inline-flex items-center gap-2.5  p-.5">
        {label ? (
          <span className="text-[11px] font-medium text-foreground whitespace-nowrap">
            {label}
          </span>
        ) : null}
        {shortcut ? (
          <span className="text-[11px] font-semibold leading-none text-foreground whitespace-nowrap">
            {shortcut}
          </span>
        ) : null}
        {children}
      </div>
    </TooltipContent>
  )
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  AppTooltipContent
}
