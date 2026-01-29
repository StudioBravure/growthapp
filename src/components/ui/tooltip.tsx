"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode, delayDuration?: number }) => <>{children}</>

const Tooltip = ({ children }: { children: React.ReactNode }) => <div className="group relative z-40 inline-block">{children}</div>

const TooltipTrigger = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement> & { asChild?: boolean }>(
    ({ className, asChild, children, ...props }, ref) => {
        if (asChild) {
            return <>{children}</>
        }
        return (
            <button ref={ref as any} className={className} {...props}>
                {children}
            </button>
        )
    }
)
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { side?: "top" | "bottom" | "left" | "right" }>(
    ({ className, side = "top", ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 hidden group-hover:block whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 border border-border",
                side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
                side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
                side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
                side === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
                className
            )}
            {...props}
        />
    )
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
