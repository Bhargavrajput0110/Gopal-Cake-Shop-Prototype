"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { Menu, X, LogOut, Home, Inbox, Play, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Incoming", href: "?tab=incoming", icon: Inbox, value: "incoming" },
  { name: "My Production", href: "?tab=production", icon: Play, value: "production" },
  { name: "Ready", href: "?tab=ready", icon: CheckCircle, value: "ready" },
];

export function ChefMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "incoming";

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="md:hidden p-2 -ml-2 text-[#3E2723] hover:bg-[#C5A059]/10 rounded-lg transition-colors">
        <Menu className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[9999] bg-[#FCF9F2] dark:bg-[#2D1E17] flex flex-col md:hidden"
          >
            <div className="p-4 border-b border-[#C5A059]/20 flex justify-between items-center bg-white/50">
              <div>
                <p className="text-xs font-black text-[#C5A059] uppercase tracking-[0.2em]">Kitchen Display</p>
                <p className="text-sm font-bold text-[#3E2723] mt-1 tracking-wide">Chef Station</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-[#3E2723] hover:text-rose-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 mt-1">Select View</p>
              {navItems.map((item) => {
                const isActive = currentTab === item.value;
                return (
                  <Link 
                    key={item.value} 
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all duration-300 ${
                      isActive 
                        ? "bg-[#C5A059] text-white shadow-md" 
                        : "text-muted-foreground hover:bg-black/5 hover:text-[#3E2723]"
                    }`}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-6 border-t border-[#C5A059]/20 space-y-3 bg-white/50">
              <Link 
                href="/" 
                className="flex items-center gap-3 p-3.5 rounded-xl font-bold text-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 transition-colors"
              >
                <Home className="w-5 h-5 shrink-0" />
                Back to Website
              </Link>
              <button 
                onClick={() => { document.cookie = 'gopal_dummy_role=; path=/; max-age=0'; window.location.href='/login'; }}
                className="flex items-center gap-3 p-3.5 rounded-xl font-bold text-rose-500 bg-rose-500/10 w-full hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
