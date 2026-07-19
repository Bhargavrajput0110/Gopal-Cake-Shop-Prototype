"use client"

import { AppSidebar, AppTopbar, ADMIN_NAV_CONFIG } from "@/components/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen mesh-bg">
      <AppSidebar config={ADMIN_NAV_CONFIG} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <AppTopbar config={ADMIN_NAV_CONFIG} searchPlaceholder="Search orders, products, customers..." />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
