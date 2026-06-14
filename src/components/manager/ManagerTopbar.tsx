"use client";

import { Bell, Search } from "lucide-react";
import { ManagerMobileNav } from "./ManagerMobileNav";

export function ManagerTopbar() {
  return (
    <header className="h-16 border-b border-border bg-card/95 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-4 flex-1">
        <ManagerMobileNav />
        
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search orders, products, or customers..." 
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/50 text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button className="relative p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
        </button>
        
        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
          A
        </div>
      </div>
    </header>
  );
}
