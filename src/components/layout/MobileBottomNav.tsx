"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Category, Bag, User } from "iconsax-react";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useCustomerAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 pointer-events-none">
      <div className="bg-white/95 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-2 py-1 flex justify-between items-center pointer-events-auto">
        
        {/* Home */}
        <Link 
          href="/" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${pathname === "/" ? "text-[var(--brand-deep-rose)]" : "text-foreground/50 hover:text-foreground/80"}`}
        >
          <Home variant={pathname === "/" ? "Bold" : "Linear"} size={22} color="currentColor" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Home</span>
        </Link>

        {/* Categories */}
        <Link 
          href="/menu" 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${pathname?.startsWith("/menu") ? "text-[var(--brand-deep-rose)]" : "text-foreground/50 hover:text-foreground/80"}`}
        >
          <Category variant={pathname?.startsWith("/menu") ? "Bold" : "Linear"} size={22} color="currentColor" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Menu</span>
        </Link>

        {/* Cart */}
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors text-foreground/50 hover:text-foreground/80"
        >
          <div className="relative">
            <Bag variant="Linear" size={22} color="currentColor" />
            {totalItems > 0 && (
              <span className="absolute -right-2 -top-1 w-4 h-4 bg-[var(--brand-deep-rose)] text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold tracking-widest uppercase">Cart</span>
        </button>

        {/* Profile */}
        <Link 
          href={user ? "/customer/orders" : "/customer/login"} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${pathname?.startsWith("/customer") ? "text-[var(--brand-deep-rose)]" : "text-foreground/50 hover:text-foreground/80"}`}
        >
          <User variant={pathname?.startsWith("/customer") ? "Bold" : "Linear"} size={22} color="currentColor" />
          <span className="text-[9px] font-bold tracking-widest uppercase">Profile</span>
        </Link>
        
      </div>
    </div>
  );
}
