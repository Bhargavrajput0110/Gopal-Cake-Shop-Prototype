"use client"

import { AppTopbar, CHEF_NAV_CONFIG } from "@/components/navigation"

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chef KDS is full-width — no sidebar, but has a topbar for context/sign-out */}
      <AppTopbar config={CHEF_NAV_CONFIG} showSearch={false} />
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
        {children}
      </main>
    </div>
  )
}
