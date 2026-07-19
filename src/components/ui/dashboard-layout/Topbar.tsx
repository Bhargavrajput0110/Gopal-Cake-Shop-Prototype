"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TopbarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

export function Topbar({ className, children, ...props }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
        {children}
      </div>
    </header>
  )
}
