"use client"

import { AppTopbar } from "@/components/navigation"
import { DELIVERY_NAV_CONFIG } from "@/components/navigation/nav-configs"

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      <AppTopbar config={DELIVERY_NAV_CONFIG} showSearch={false} />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
