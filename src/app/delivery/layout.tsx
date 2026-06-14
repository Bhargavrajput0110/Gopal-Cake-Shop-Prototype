"use client";

import { Navigation, Menu, LogOut, Wallet } from "lucide-react";

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Topbar */}
      <header className="bg-[#3E2723] text-[#FAFAF8] sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#C5A059] p-2 rounded-full text-[#3E2723]">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight font-serif text-[#C5A059]">Driver App</h1>
              <p className="text-[10px] font-bold text-[#FAFAF8]/70 uppercase tracking-widest">Rider: Amit Kumar</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-[#C5A059]" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full">
        {children}
      </main>

      {/* Fixed Bottom Navigation (Mobile Native Feel) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center justify-around p-3 w-full max-w-7xl mx-auto">
          <button className="flex flex-col items-center gap-1 text-[#C5A059]">
            <Navigation className="w-6 h-6 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider">Deliveries</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-[#3E2723] transition-colors">
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Collection</span>
          </button>
          <button 
            onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Off Duty</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
