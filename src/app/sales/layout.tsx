"use client"

import { AppSidebar, AppTopbar, SALES_NAV_CONFIG } from "@/components/navigation"
import { ClipboardText, Monitor, Location, Convert3DCube, ShoppingCart } from "iconsax-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  const bottomNavItems = [
    { name: "Orders", href: "/sales/orders", icon: ClipboardText },
    { name: "POS", href: "/sales/pos", icon: Monitor },
    { name: "Checkout", href: "/sales/checkout", icon: ShoppingCart },
    { name: "Delivery", href: "/sales/delivery", icon: Location },
    { name: "Transfers", href: "/sales/transfers", icon: Convert3DCube },
  ];

  return (
    <div className="min-h-screen mesh-bg pb-16 md:pb-0">
      <AppSidebar config={SALES_NAV_CONFIG} />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <AppTopbar config={SALES_NAV_CONFIG} searchPlaceholder="Global search... (Try order #108922)" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--border)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-[100] pb-safe">
        <div className="flex items-center justify-around p-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 p-1">
                <div className={`p-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--brand-champagne)]/10 text-[var(--brand-champagne)]' : 'text-[var(--muted-foreground)]'}`}>
                  <Icon className="w-6 h-6" variant={isActive ? "Bold" : "Linear"} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--brand-champagne)]' : 'text-[var(--muted-foreground)]'}`}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
