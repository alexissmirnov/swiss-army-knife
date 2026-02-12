import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-ds-gray-900 focus-visible:border-ds-gray-alpha-600 focus-visible:ring-ds-gray-alpha-400 aria-invalid:ring-ds-red-200 dark:aria-invalid:ring-ds-red-300 aria-invalid:border-ds-red-600 bg-ds-background-100 flex field-sizing-content min-h-16 w-full rounded-md border border-ds-gray-alpha-400 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
