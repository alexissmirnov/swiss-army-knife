import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusDotVariants = cva(
  "inline-flex h-2 w-2 rounded-full",
  {
    variants: {
      state: {
        queued: "bg-ds-gray-400",
        loading: "bg-ds-amber-700",
        success: "bg-ds-green-700",
        error: "bg-ds-red-700",
      },
    },
    defaultVariants: {
      state: "queued",
    },
  }
)

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusDotVariants> {}

function StatusDot({ className, state, ...props }: StatusDotProps) {
  return (
    <div className={cn(statusDotVariants({ state }), className)} {...props} />
  )
}

export { StatusDot, statusDotVariants }