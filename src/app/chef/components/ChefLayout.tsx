import * as React from 'react'
import { Suspense } from 'react'
import { Reserve, Clock, Notification } from "iconsax-react"
import { ChefMobileNav } from '@/components/chef/ChefMobileNav' // We can reuse or rebuild this

interface ChefLayoutProps {
  children: React.ReactNode
  branchName?: string
  lastUpdated?: Date
}

export function ChefLayout({ children, branchName = "Kitchen", lastUpdated }: ChefLayoutProps) {
  return (
    <div className="flex flex-col h-screen mesh-bg overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-16 glass-panel flex items-center justify-between px-6 shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="bg-secondary/10 p-2.5 rounded-xl border border-secondary/20 shadow-sm text-secondary">
            <Reserve className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold leading-none text-foreground tracking-tight">KDS <span className="font-sans font-bold text-[10px] uppercase tracking-widest text-foreground/50 ml-3">{branchName}</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {lastUpdated && (
            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-foreground/50 bg-white/50 border border-border/40 px-3 py-1.5 rounded-full shadow-sm">
              <Clock className="w-3.5 h-3.5 text-secondary" />
              Sync: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <button className="relative p-2 text-foreground/50 hover:text-secondary transition-colors rounded-full hover:bg-secondary/5 border border-transparent hover:border-secondary/20">
            <Notification className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-transparent">
        {children}
      </main>
      
      {/* Mobile Nav for small screens */}
      <div className="md:hidden">
        <Suspense fallback={<div className="h-14 bg-card border-t" />}>
          <ChefMobileNav />
        </Suspense>
      </div>
    </div>
  )
}
