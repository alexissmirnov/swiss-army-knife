"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: "linear" | "circular"
  size?: number // For circular variant
  strokeWidth?: number // For circular variant
  showPercentage?: boolean // For circular variant - whether to show percentage in center
}

function Progress({
  className,
  value,
  variant = "linear",
  size = 40,
  strokeWidth = 4,
  showPercentage = false,
  ...props
}: ProgressProps) {
  if (variant === "circular") {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const progressValue = value || 0
    const strokeDashoffset = circumference - (progressValue / 100) * circumference

    return (
      <div 
        className={cn("relative inline-flex items-center justify-center", className)}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={"stroke-ds-gray-alpha-300"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn("transition-all duration-500 ease-out stroke-ds-blue-600", className)}
          />
        </svg>
        {/* Optional content in center */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium text-ds-gray-1000">
              {Math.round(progressValue)}%
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-ds-gray-100 relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-ds-blue-600 h-full w-full flex-1 transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
