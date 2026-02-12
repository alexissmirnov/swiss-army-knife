"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-ds-gray-alpha-400 bg-ds-background-100 data-[state=checked]:bg-ds-gray-900 data-[state=checked]:text-ds-gray-1000 data-[state=checked]:border-ds-gray-900 focus-visible:border-ds-gray-900 focus-visible:ring-ds-gray-900/50 aria-invalid:ring-ds-red-600/20 dark:aria-invalid:ring-ds-red-600/40 aria-invalid:border-ds-red-600 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
