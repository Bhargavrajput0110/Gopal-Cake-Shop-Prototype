"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CartDrawer } from "../public/CartDrawer";
import { MobileBottomNav } from "./MobileBottomNav";

export function HeaderFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide global Navbar and Footer on dedicated app screens
  const isStandaloneApp = pathname?.startsWith("/chef") || 
                          pathname?.startsWith("/driver") || 
                          pathname?.startsWith("/delivery") || 
                          pathname?.startsWith("/admin") || 
                          pathname?.startsWith("/sales") || 
                          pathname?.startsWith("/manager") || 
                          pathname?.startsWith("/vendor") || 
                          pathname?.startsWith("/login");

  return (
    <>
      {!isStandaloneApp && (
        <>
          <Navbar />
          <CartDrawer />
          <MobileBottomNav />
        </>
      )}
      <main className={`flex-1 flex flex-col ${!isStandaloneApp ? "pb-24 md:pb-0" : ""}`}>
        {children}
      </main>
      {!isStandaloneApp && <Footer />}
    </>
  );
}
