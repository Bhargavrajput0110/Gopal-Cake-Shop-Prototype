"use client"

import { AppSidebar, AppTopbar, ADMIN_NAV_CONFIG } from "@/components/navigation"
import { SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // POS create page needs full-screen — no padding, no sidebar interference
  const isPOSPage = pathname === '/admin/orders/create'

  return (
    <SessionProvider>
      <div className="min-h-screen mesh-bg">
        {!isPOSPage && <AppSidebar config={ADMIN_NAV_CONFIG} />}
        <div className={isPOSPage ? 'flex flex-col min-h-screen' : 'md:pl-64 flex flex-col min-h-screen'}>
          {!isPOSPage && <AppTopbar config={ADMIN_NAV_CONFIG} searchPlaceholder="Search orders, products, customers..." />}
          <main className={isPOSPage ? 'flex-1 overflow-hidden' : 'flex-1 p-4 sm:p-6 lg:p-8'}>
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
