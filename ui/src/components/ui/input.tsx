import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-md border border-ds-gray-alpha-400 bg-ds-background-100 px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "placeholder:text-ds-gray-900",
        "text-ds-gray-1000",
        "selection:bg-ds-gray-1000 selection:text-ds-background-100",
        "focus-visible:border-ds-gray-alpha-600 focus-visible:ring-[3px] focus-visible:ring-ds-gray-alpha-400",
        "aria-invalid:border-ds-red-600 aria-invalid:ring-ds-red-300",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ds-gray-1000",
        "text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
