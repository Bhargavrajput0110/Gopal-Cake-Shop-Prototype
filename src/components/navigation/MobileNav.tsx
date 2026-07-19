"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HambergerMenu, CloseSquare, Logout, Home2 } from "iconsax-react"
import { cn } from "@/lib/utils"
import type { AppConfig } from "./navigation.types"

interface MobileNavProps {
  config: AppConfig
}

export function MobileNav({ config }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === config.rootHref
      ? pathname === href
      : pathname === href || pathname?.startsWith(href + "/")

  const handleSignOut = () => {
    setIsOpen(false)
    if (config.onSignOut) {
      config.onSignOut()
    } else {
      document.cookie = "gopal_dummy_role=; path=/; max-age=0"
      window.location.href = "/login"
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
        aria-label="Open navigation menu"
      >
        <HambergerMenu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer — CSS transition, no framer-motion (ERP Motion Guideline) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[9999] w-72 bg-card flex flex-col md:hidden transition-transform duration-300 ease-out shadow-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
              {config.appSubtitle}
            </p>
            <p className="text-sm font-bold text-foreground mt-0.5">{config.appName}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            aria-label="Close navigation menu"
          >
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
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
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                    {item.badge != null && (
                      <span
                        className={cn(
                          "ml-auto px-2 py-0.5 rounded-full text-[10px] font-black",
                          active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
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

        {/* Footer */}
        <div className="p-3 border-t border-border space-y-1 shrink-0">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <Home2 className="w-4 h-4 shrink-0" />
            Back to Website
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 p-3 rounded-xl font-semibold text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 w-full transition-colors"
          >
            <Logout className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
