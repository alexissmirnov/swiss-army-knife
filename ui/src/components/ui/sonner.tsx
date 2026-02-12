"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--ds-background-100)",
          "--normal-text": "var(--ds-gray-1000)",
          "--normal-border": "var(--ds-gray-alpha-400)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
