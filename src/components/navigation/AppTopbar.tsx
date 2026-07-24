"use client"

import { SearchNormal1 } from "iconsax-react"
import { cn } from "@/lib/utils"
import { MobileNav } from "./MobileNav"
import type { AppConfig } from "./navigation.types"
import { NotificationBell } from "@/components/layout/NotificationBell"

interface AppTopbarProps {
  config: AppConfig
  /** Optional: show the global search bar (default: true) */
  showSearch?: boolean
  /** Optional: search placeholder text */
  searchPlaceholder?: string
  /** Optional: override topbar className */
  className?: string
}

export function AppTopbar({
  config,
  showSearch = true,
  searchPlaceholder = "Search...",
  className,
}: AppTopbarProps) {
  const user = config.user

  return (
    <header
      className={cn(
        "h-16 glass-panel border-b-0 border-l-0 border-r-0 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Mobile hamburger */}
        <MobileNav config={config} />

        {/* Search */}
        {showSearch && (
          <div className="relative w-full max-w-md hidden sm:block">
            <SearchNormal1 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 text-sm transition-all outline-none"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Live Notification Bell */}
        <NotificationBell />

        {/* User avatar and Auth Mock */}
        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div
            className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0"
            title={user?.name}
          >
            {user?.initials ?? "?"}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              {user?.name || 'Staff'}
              {user?.mockId && (
                <span className="bg-[var(--brand-champagne)]/10 text-[var(--brand-champagne)] border border-[var(--brand-champagne)]/20 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  {user.mockId}
                </span>
              )}
            </span>
            <button onClick={config.onSignOut || (() => { window.location.href = '/login' })} className="text-[9px] font-bold text-muted-foreground hover:text-rose-600 transition-colors uppercase tracking-[0.2em] cursor-pointer text-left w-max">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
