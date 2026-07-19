"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Category, Bag, User } from "iconsax-react";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { motion } from "framer-motion";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useCustomerAuth();

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Home variant={pathname === "/" ? "Bold" : "Linear"} className="w-6 h-6" />,
      isActive: pathname === "/"
    },
    {
      name: "Categories",
      href: "/menu",
      icon: <Category variant={pathname?.startsWith("/menu") ? "Bold" : "Linear"} className="w-6 h-6" />,
      isActive: pathname?.startsWith("/menu")
    },
    {
      name: "Profile",
      href: user ? "/customer/orders" : "/customer/login",
      icon: <User variant={pathname?.startsWith("/customer") ? "Bold" : "Linear"} className="w-6 h-6" />,
      isActive: pathname?.startsWith("/customer")
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 pointer-events-none">
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full px-6 py-3 flex justify-between items-center pointer-events-auto">
        
        {navItems.slice(0, 2).map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${item.isActive ? "text-primary" : "text-foreground/50 hover:text-foreground/80"}`}
          >
            <div className="relative">
              {item.icon}
              {item.isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </div>
            <span className="text-[9px] font-bold tracking-wider">{item.name}</span>
          </Link>
        ))}

        {/* Floating Cart Button in Center */}
        <div className="relative -top-5 pointer-events-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-14 h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(74,59,53,0.4)] hover:-translate-y-1 transition-all border-[3px] border-background relative z-10"
          >
            <Bag variant="Linear" className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {navItems.slice(2).map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-14 transition-colors ${item.isActive ? "text-primary" : "text-foreground/50 hover:text-foreground/80"}`}
          >
            <div className="relative">
              {item.icon}
              {item.isActive && (
                <motion.div 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </div>
            <span className="text-[9px] font-bold tracking-wider">{item.name}</span>
          </Link>
        ))}
        
      </div>
    </div>
  );
}
