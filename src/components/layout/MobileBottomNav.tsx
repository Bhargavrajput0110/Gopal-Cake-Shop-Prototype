"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home2, Category2, Bag2, Profile } from "iconsax-react";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const NAV_ITEMS = [
  { label: "Home",    href: "/",         icon: Home2,     match: (p: string) => p === "/" },
  { label: "Menu",    href: "/menu",     icon: Category2, match: (p: string) => p.startsWith("/menu") },
  { label: "Cart",    href: null,        icon: Bag2,      match: () => false },
  { label: "Profile", href: "/customer", icon: Profile,   match: (p: string) => p.startsWith("/customer") },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useCustomerAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[99] px-3 pb-3 pt-1 pointer-events-none">
      <nav className="glass border border-[var(--border)]/30 shadow-[0_-4px_30px_rgba(28,15,10,0.12)] rounded-[22px] px-1 py-1.5 flex justify-between items-center pointer-events-auto">
        
        {/* Home */}
        <Link
          href="/"
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
            pathname === "/" ? "text-[var(--brand-deep-rose)]" : "text-foreground/40 hover:text-foreground/70"
          }`}
        >
          {pathname === "/" && (
            <motion.div
              layoutId="mbn-active"
              className="absolute inset-0 bg-[var(--brand-deep-rose)]/8 rounded-2xl"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <Home2 variant={pathname === "/" ? "Bold" : "Linear"} size={21} color="currentColor" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Home</span>
        </Link>

        {/* Menu */}
        <Link
          href="/menu"
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
            pathname?.startsWith("/menu") ? "text-[var(--brand-deep-rose)]" : "text-foreground/40 hover:text-foreground/70"
          }`}
        >
          {pathname?.startsWith("/menu") && (
            <motion.div
              layoutId="mbn-active"
              className="absolute inset-0 bg-[var(--brand-deep-rose)]/8 rounded-2xl"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <Category2 variant={pathname?.startsWith("/menu") ? "Bold" : "Linear"} size={21} color="currentColor" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Menu</span>
        </Link>

        {/* Cart — center highlight */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 text-foreground/40 hover:text-foreground/70"
        >
          <div className="relative -mt-5 mb-0.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-deep-rose)] shadow-[0_4px_16px_rgba(139,58,82,0.4)] flex items-center justify-center">
              <Bag2 variant="Bold" size={22} color="#fff" />
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--brand-champagne)] text-[var(--brand-chocolate)] text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {totalItems}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold tracking-wider uppercase text-foreground/40">Cart</span>
        </button>

        {/* Profile */}
        <Link
          href={user ? "/customer/orders" : "/customer/login"}
          className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
            pathname?.startsWith("/customer") ? "text-[var(--brand-deep-rose)]" : "text-foreground/40 hover:text-foreground/70"
          }`}
        >
          {pathname?.startsWith("/customer") && (
            <motion.div
              layoutId="mbn-active"
              className="absolute inset-0 bg-[var(--brand-deep-rose)]/8 rounded-2xl"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <Profile variant={pathname?.startsWith("/customer") ? "Bold" : "Linear"} size={21} color="currentColor" />
          <span className="text-[9px] font-bold tracking-wider uppercase">Profile</span>
        </Link>

      </nav>
    </div>
  );
}
