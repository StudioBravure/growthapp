"use client"

import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext<{
    value?: string
    onValueChange?: (value: string) => void
}>({})

const RadioGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: string, onValueChange?: (value: string) => void }>(
    ({ className, value, onValueChange, ...props }, ref) => {
        return (
            <RadioGroupContext.Provider value={{ value, onValueChange }}>
                <div className={cn("grid gap-2", className)} ref={ref} {...props} />
            </RadioGroupContext.Provider>
        )
    }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }>(
    ({ className, value: itemValue, ...props }, ref) => {
        const { value, onValueChange } = React.useContext(RadioGroupContext)
        const checked = value === itemValue

        return (
            <button
                ref={ref}
                type="button" // prevent form submission
                role="radio"
                aria-checked={checked}
                onClick={() => onValueChange?.(itemValue)}
                className={cn(
                    "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            >
                <div className={cn("flex items-center justify-center", checked ? "opacity-100" : "opacity-0")}>
                    <Circle className="h-2.5 w-2.5 fill-current text-current" />
                </div>
            </button>
        )
    }
)
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
