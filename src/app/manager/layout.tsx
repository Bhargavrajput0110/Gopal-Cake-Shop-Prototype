"use client"

import { AppSidebar, AppTopbar, MANAGER_NAV_CONFIG } from "@/components/navigation"

import { SessionProvider } from "next-auth/react"

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <AppSidebar config={MANAGER_NAV_CONFIG} />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <AppTopbar config={MANAGER_NAV_CONFIG} searchPlaceholder="Search..." />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
