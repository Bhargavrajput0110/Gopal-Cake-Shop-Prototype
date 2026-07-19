import * as React from "react"
import { cn } from "@/lib/utils"

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  direction?: "row" | "col" | "row-reverse" | "col-reverse"
  wrap?: boolean
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "none"
}

export function Flex({
  as: Component = "div",
  className,
  align,
  justify,
  direction = "row",
  wrap = false,
  gap,
  ...props
}: FlexProps) {
  return (
    <Component
      className={cn(
        "flex",
        {
          "flex-col": direction === "col",
          "flex-row": direction === "row",
          "flex-row-reverse": direction === "row-reverse",
          "flex-col-reverse": direction === "col-reverse",
          
          "flex-wrap": wrap,
          
          "items-start": align === "start",
          "items-center": align === "center",
          "items-end": align === "end",
          "items-stretch": align === "stretch",
          "items-baseline": align === "baseline",
          
          "justify-start": justify === "start",
          "justify-center": justify === "center",
          "justify-end": justify === "end",
          "justify-between": justify === "between",
          "justify-around": justify === "around",
          "justify-evenly": justify === "evenly",
          
          "gap-1": gap === "xs",
          "gap-2": gap === "sm",
          "gap-4": gap === "md",
          "gap-6": gap === "lg",
          "gap-8": gap === "xl",
          "gap-12": gap === "2xl",
          "gap-0": gap === "none",
        },
        className
      )}
      {...props}
    />
  )
}
