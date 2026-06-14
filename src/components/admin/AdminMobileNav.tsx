"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { navItems } from "./AdminSidebar";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menu = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-card text-foreground flex flex-col md:hidden"
        >
          <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/20">
            <div>
              <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Command Centre</p>
              <p className="text-sm font-bold text-foreground mt-1 tracking-wide">Owner / Admin</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 text-foreground hover:text-rose-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl font-bold transition-all duration-300 ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="tracking-wide">{item.name}</span>
                  {item.badge && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm ${isActive ? "bg-white text-primary" : "bg-primary/10 text-primary"}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="p-6 border-t border-border space-y-3 bg-secondary/10">
            <Link 
              href="/" 
              className="flex items-center gap-3 p-3.5 rounded-xl font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
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
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="md:hidden p-2 -ml-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
        <Menu className="w-6 h-6" />
      </button>
      {mounted && createPortal(menu, document.body)}
    </>
  );
}
