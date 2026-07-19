"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface DashboardLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  sidebar?: React.ReactNode
  topbar?: React.ReactNode
  children: React.ReactNode
}

export function DashboardLayout({ className, sidebar, topbar, children, ...props }: DashboardLayoutProps) {
  return (
    <div className={cn("flex min-h-screen w-full bg-muted/40", className)} {...props}>
      {sidebar && sidebar}
      <div className="flex flex-col w-full flex-1">
        {topbar && topbar}
        <main className="flex-1 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
