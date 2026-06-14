"use client";

import { Bell, ChefHat } from "lucide-react";
import { ChefMobileNav } from "./ChefMobileNav";

export function ChefTopbar() {
  return (
    <header className="h-14 border-b border-[#C5A059]/20 bg-white/95 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <ChefMobileNav />
        <div className="hidden sm:flex p-1.5 bg-[#3E2723] rounded-md text-[#C5A059] shadow-sm">
          <ChefHat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-black text-[#3E2723] tracking-tight font-serif">Kitchen Display System</h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest -mt-0.5">Khanderao Market Branch</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3 mr-2">
          <div className="text-right">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Active Tickets</p>
            <p className="text-sm font-black text-[#C5A059] leading-none">8</p>
          </div>
          <div className="h-6 w-px bg-border"></div>
          <div className="text-right">
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Avg Time</p>
            <p className="text-sm font-black text-rose-500 leading-none">14m</p>
          </div>
        </div>

        <button className="relative p-2 bg-secondary hover:bg-[#C5A059]/10 hover:text-[#C5A059] rounded-lg transition-colors border border-border/50">
          <Bell className="w-4 h-4 text-[#3E2723]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
