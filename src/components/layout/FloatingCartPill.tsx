"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "iconsax-react";
import { useCart } from "@/context/CartContext";

import { useRouter, usePathname } from "next/navigation";

export function FloatingCartPill() {
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/checkout") return null;

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-[84px] md:bottom-6 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto"
        >
          <div className="flex items-stretch bg-[var(--brand-chocolate)] rounded-full shadow-[0_8px_32px_rgba(28,15,10,0.35)] hover:shadow-[0_12px_40px_rgba(28,15,10,0.5)] transition-all duration-300 group overflow-hidden border border-white/5">
            
            {/* Left Zone: View Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 pl-4 pr-3 py-3 hover:bg-white/5 transition-colors"
            >
              {/* Item count badge */}
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                  <ShoppingBag size={18} color="#fff" variant="Bold" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--brand-champagne)] text-[var(--brand-chocolate)] text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[var(--brand-chocolate)]">
                  {totalItems}
                </span>
              </div>

              {/* Middle text */}
              <div className="flex flex-col leading-none min-w-0 text-left">
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-white/60">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
                <span className="font-display italic font-bold text-base text-white leading-tight mt-0.5">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
            </button>

            {/* Right Zone: Checkout (Primary Action) */}
            <button
              onClick={() => router.push('/checkout')}
              className="flex items-center gap-1.5 pl-4 pr-5 py-3 bg-[var(--brand-deep-rose)] hover:bg-[#8B2A53] transition-colors"
            >
              <span className="font-ui text-[11px] font-black uppercase tracking-[0.1em] text-white whitespace-nowrap">
                Checkout
              </span>
              <svg className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
