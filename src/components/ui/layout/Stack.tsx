import * as React from "react"
import { cn } from "@/lib/utils"

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  direction?: "row" | "col"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  spacing?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "none"
  wrap?: boolean
}

export function Stack({
  as: Component = "div",
  className,
  direction = "col",
  align,
  justify,
  spacing = "md",
  wrap = false,
  ...props
}: StackProps) {
  return (
    <Component
      className={cn(
        "flex",
        {
          "flex-col": direction === "col",
          "flex-row": direction === "row",
          "flex-wrap": wrap,
          
          // Alignment
          "items-start": align === "start",
          "items-center": align === "center",
          "items-end": align === "end",
          "items-stretch": align === "stretch",
          "items-baseline": align === "baseline",
          
          // Justification
          "justify-start": justify === "start",
          "justify-center": justify === "center",
          "justify-end": justify === "end",
          "justify-between": justify === "between",
          "justify-around": justify === "around",
          "justify-evenly": justify === "evenly",
          
          // Spacing (Matches Brand Guidelines)
          "gap-1": spacing === "xs",    // 4px
          "gap-2": spacing === "sm",    // 8px
          "gap-3": spacing === "md",    // 12px
          "gap-4": spacing === "lg",    // 16px
          "gap-6": spacing === "xl",    // 24px
          "gap-8": spacing === "2xl",   // 32px
          "gap-12": spacing === "3xl",  // 48px
          "gap-0": spacing === "none",
        },
        className
      )}
      {...props}
    />
  )
}
