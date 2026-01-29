"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultOpen?: boolean
}

const CollapsibleContext = React.createContext<{
    open: boolean
    onOpenChange: (open: boolean) => void
}>({ open: false, onOpenChange: () => { } })

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
    ({ className, open: controlledOpen, onOpenChange: controlledOnOpenChange, defaultOpen = false, children, ...props }, ref) => {
        const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)

        const isControlled = controlledOpen !== undefined
        const open = isControlled ? controlledOpen : uncontrolledOpen
        const onOpenChange = isControlled ? controlledOnOpenChange : setUncontrolledOpen

        return (
            <CollapsibleContext.Provider value={{ open: !!open, onOpenChange: onOpenChange || (() => { }) }}>
                <div ref={ref} className={cn(className)} {...props}>
                    {children}
                </div>
            </CollapsibleContext.Provider>
        )
    }
)
Collapsible.displayName = "Collapsible"

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, children, onClick, ...props }, ref) => {
        const { open, onOpenChange } = React.useContext(CollapsibleContext)

        return (
            <button
                ref={ref}
                type="button"
                onClick={(e) => {
                    onOpenChange(!open)
                    onClick?.(e)
                }}
                className={cn("flex items-center justify-between", className)}
                {...props}
            >
                {children}
            </button>
        )
    }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { open } = React.useContext(CollapsibleContext)

        if (!open) return null

        return (
            <div
                ref={ref}
                className={cn("overflow-hidden animate-in slide-in-from-top-1", className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
