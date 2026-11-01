"use client";

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Logout, Cake, Shop, Car, Reserve } from "iconsax-react"
import { cn } from "@/lib/utils"
import type { AppConfig } from "./navigation.types"
import { useSession } from "next-auth/react"
import { authSignOut } from "@/lib/authUtils"

interface AppSidebarProps {
  config: AppConfig
}

export function AppSidebar({ config }: AppSidebarProps) {
  const pathname = usePathname()
  const sessionObj = useSession ? useSession() : null
  const session = sessionObj?.data

  const rawPerms = (session?.user as any)?.customPermissions
  const customPerms: Record<string, boolean> = React.useMemo(() => {
    if (!rawPerms) return {}
    try {
      return typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms
    } catch {
      return {}
    }
  }, [rawPerms])

  const userRole = ((session?.user as any)?.role || '').toUpperCase()

  const dynamicItems = React.useMemo(() => {
    const items: Array<{ name: string; href: string; icon: any; badge?: string | number }> = []

    // Grant Chef / Kitchen Display power to non-chefs (e.g. Salesperson granted Chef power)
    if (userRole !== 'CHEF' && (customPerms['kds_screen'] || customPerms['cake_prep_stages'])) {
      items.push({ name: "Kitchen Terminal (KDS)", href: "/chef", icon: Cake, badge: "Chef Access" })
    }

    // Grant Counter POS / Billing power to non-sales
    if (userRole !== 'SALESPERSON' && userRole !== 'ADMIN' && customPerms['pos_orders']) {
      items.push({ name: "POS Terminal", href: "/sales/pos", icon: Shop, badge: "Sales Access" })
    }

    // Grant Driver Dispatch / Delivery power
    if (userRole !== 'DELIVERY' && userRole !== 'ADMIN' && customPerms['driver_dispatch']) {
      items.push({ name: "Driver App", href: "/driver", icon: Car, badge: "Driver Access" })
    }

    // Grant Vendor tasks power
    if (!userRole?.startsWith('VENDOR') && userRole !== 'ADMIN' && (customPerms['vendor_florist'] || customPerms['vendor_photo'] || customPerms['vendor_acrylic'])) {
      items.push({ name: "Vendor Tasks", href: "/vendor", icon: Reserve, badge: "Vendor Access" })
    }

    return items
  }, [userRole, customPerms])

  const displayName = session?.user?.name || config.user?.name || 'Staff'
  const displayRole = (session?.user as any)?.role || config.user?.role || 'Staff'
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const isActive = (href: string) =>
    href === config.rootHref
      ? pathname === href
      : pathname === href || pathname?.startsWith(href + "/")

  const handleSignOut = () => {
    authSignOut("/login")
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-sidebar flex flex-col hidden md:flex z-30 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3 shrink-0">
        <Image src="/logo.png" alt="Gopal Cake Shop Logo" width={32} height={32} className="w-8 h-8 object-contain shrink-0" />
        <div className="min-w-0">
          <h1 className="text-sm font-black text-foreground tracking-tight leading-none truncate">
            {config.appName}
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
            {config.appSubtitle}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {config.nav.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-0.5">
            {section.label && (
              <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-semibold",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0" color="currentColor" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge != null && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Granted Capabilities based on Admin YES/NO Overrides */}
        {dynamicItems.length > 0 && (
          <div className="space-y-0.5 pt-3 border-t border-border/60">
            <p className="px-3 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>⭐ Granted Capabilities</span>
            </p>
            {dynamicItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-semibold",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 shrink-0 text-amber-500" color="currentColor" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge != null && (
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-amber-500/15 text-amber-700 border border-amber-500/30"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border space-y-1 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-black text-xs">{displayInitials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-medium">{displayRole}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 text-sm font-semibold text-foreground/60 hover:text-destructive transition-colors w-full px-3 py-2 rounded-xl hover:bg-destructive/10"
        >
          <Logout className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
