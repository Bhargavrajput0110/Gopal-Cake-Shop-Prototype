"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logout } from "iconsax-react"
import { cn } from "@/lib/utils"
import type { AppConfig } from "./navigation.types"

interface AppSidebarProps {
  config: AppConfig
}

export function AppSidebar({ config }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === config.rootHref
      ? pathname === href
      : pathname === href || pathname?.startsWith(href + "/")

  const handleSignOut = () => {
    if (config.onSignOut) {
      config.onSignOut()
    } else {
      document.cookie = "gopal_dummy_role=; path=/; max-age=0"
      window.location.href = "/login"
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-sidebar flex flex-col hidden md:flex z-30 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-border gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-primary font-black text-sm">G</span>
        </div>
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
                    <item.icon className="w-4 h-4 shrink-0" />
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
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-border space-y-1 shrink-0">
        {config.user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-black text-xs">{config.user.initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-foreground truncate">{config.user.name}</p>
              <p className="text-[10px] text-muted-foreground font-medium">{config.user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors w-full px-3 py-2 rounded-xl hover:bg-destructive/10"
        >
          <Logout className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
