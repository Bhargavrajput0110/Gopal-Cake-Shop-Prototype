import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "none"
}

export function Grid({
  as: Component = "div",
  className,
  cols = 1,
  gap = "md",
  ...props
}: GridProps) {
  return (
    <Component
      className={cn(
        "grid",
        {
          "grid-cols-1": cols === 1,
          "grid-cols-2": cols === 2,
          "grid-cols-3": cols === 3,
          "grid-cols-4": cols === 4,
          "grid-cols-5": cols === 5,
          "grid-cols-6": cols === 6,
          "grid-cols-12": cols === 12,
          
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
