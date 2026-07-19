"use client"

import { Location, Wallet, Logout } from "iconsax-react"
import { AppTopbar, DELIVERY_NAV_CONFIG } from "@/components/navigation"

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Delivery is mobile-first — no sidebar, uses AppTopbar */}
      <AppTopbar
        config={DELIVERY_NAV_CONFIG}
        showSearch={false}
      />

      <main className="w-full">
        {children}
      </main>

      {/* Fixed Bottom Navigation (Mobile Native Feel) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center justify-around p-3 w-full max-w-7xl mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Location className="w-6 h-6 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Deliveries</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Collection</span>
          </button>
          <button
            onClick={() => {
              document.cookie = "gopal_dummy_role=; path=/; max-age=0"
              window.location.href = "/login"
            }}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Logout className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Off Duty</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
