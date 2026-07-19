import * as React from 'react'
import { WifiSquare, Home2, Map, TickCircle, Box, ArrowLeft, User } from "iconsax-react"
import Link from 'next/link'
import { BackButton } from '@/components/ui/BackButton'

interface DriverLayoutProps {
  children: React.ReactNode
  isOffline?: boolean
  metrics?: {
    active: boolean
    today: number
    completed: number
    pending: number
    failed: number
    avgTime: string
  }
}

export function DriverLayout({ children, isOffline, metrics }: DriverLayoutProps) {
  return (
    <div className="flex flex-col h-screen mesh-bg font-sans overflow-hidden">
      
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground font-bold text-sm py-2 px-4 flex justify-center items-center gap-2 shadow-md z-50 transition-all">
          <WifiSquare className="w-4 h-4" />
          Connection Lost. Pending actions queued.
        </div>
      )}

      {/* Lightweight Metrics Header */}
      <header className="glass-panel border-b-0 px-6 py-4 shrink-0 z-10 relative">


        <div className="flex justify-between items-start mb-4">
          <div>
            <BackButton fallback="/login" label="Switch Account" variant="ghost" className="px-0 mb-1 h-auto text-[var(--muted-foreground)] hover:text-[var(--foreground)]" />
            <h1 className="font-black text-3xl font-display tracking-tight text-[var(--foreground)]">Delivery</h1>
          </div>
          {metrics && (
            <div className={`mt-2 px-4 py-1.5 rounded-full font-ui text-[9px] font-bold uppercase tracking-[0.2em] border ${metrics.active ? 'bg-[var(--brand-champagne)]/10 text-[var(--brand-champagne)] border-[var(--brand-champagne)]/30' : 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]'}`}>
              {metrics.active ? 'On Route' : 'Available'}
            </div>
          )}
        </div>

        {metrics && (
          <div className="flex gap-6 overflow-x-auto snap-x pb-2 scrollbar-hide">
            <div className="flex flex-col shrink-0">
              <span className="text-[var(--muted-foreground)] font-ui text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Today</span>
              <span className="font-display font-black text-2xl text-[var(--foreground)]">{metrics.today}</span>
            </div>
            <div className="flex flex-col shrink-0">
              <span className="text-[var(--muted-foreground)] font-ui text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Pending</span>
              <span className="font-display font-black text-2xl text-[var(--brand-champagne)]">{metrics.pending}</span>
            </div>
            <div className="flex flex-col shrink-0">
              <span className="text-[var(--muted-foreground)] font-ui text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Done</span>
              <span className="font-display font-black text-2xl text-emerald-600">{metrics.completed}</span>
            </div>
            <div className="flex flex-col shrink-0">
              <span className="text-[var(--muted-foreground)] font-ui text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5">Avg Time</span>
              <span className="font-display font-black text-2xl text-[var(--foreground)]">{metrics.avgTime}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-20 px-2 md:px-6">
        {children}
      </main>
      
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-[4.5rem] glass-panel border-t border-[var(--border)] shadow-[0_-8px_30px_rgba(74,59,53,0.08)] flex justify-around items-center z-40 pb-safe rounded-t-[2rem]">
        <Link href="/delivery" className="flex flex-col items-center justify-center w-full h-full text-[var(--brand-champagne)]">
          <Box className="w-6 h-6 mb-1" variant="Bold" />
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.2em]">Jobs</span>
        </Link>
        <button className="flex flex-col items-center justify-center w-full h-full text-[var(--muted-foreground)] hover:text-[var(--brand-champagne)] transition-colors">
          <Map className="w-6 h-6 mb-1" />
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.2em]">Map</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-[var(--muted-foreground)] hover:text-[var(--brand-champagne)] transition-colors">
          <TickCircle className="w-6 h-6 mb-1" />
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.2em]">Done</span>
        </button>
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-[var(--muted-foreground)] hover:text-[var(--brand-champagne)] transition-colors">
          <Home2 className="w-6 h-6 mb-1" />
          <span className="font-ui text-[9px] font-bold uppercase tracking-[0.2em]">Home</span>
        </Link>
      </nav>
    </div>
  )
}
