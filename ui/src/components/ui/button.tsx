import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ds-gray-alpha-600 focus-visible:ring-ds-gray-alpha-500/50 focus-visible:ring-[3px] aria-invalid:ring-ds-red-400/20 dark:aria-invalid:ring-ds-red-400/40 aria-invalid:border-ds-red-500",
  {
    variants: {
      variant: {
        default:
          "bg-ds-gray-1000 text-ds-background-100 shadow-xs hover:bg-ds-gray-950",
        destructive:
          "bg-ds-red-700 text-gray-1000 shadow-xs hover:bg-ds-red-700 focus-visible:ring-ds-red-400/20 dark:focus-visible:ring-ds-red-400/40",
        outline:
          "border border-ds-gray-alpha-400 bg-ds-background-100 shadow-xs hover:bg-ds-gray-100 hover:text-ds-gray-1000 hover:border-ds-gray-alpha-500 dark:bg-ds-gray-alpha-100 dark:hover:bg-ds-gray-alpha-200",
        secondary:
          "bg-ds-gray-200 text-ds-gray-1000 shadow-xs hover:bg-ds-gray-300",
        ghost:
          "hover:bg-ds-gray-100 hover:text-ds-gray-1000 dark:hover:bg-ds-gray-alpha-200",
        link: "text-ds-blue-600 underline-offset-4 hover:underline hover:text-ds-blue-700",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
