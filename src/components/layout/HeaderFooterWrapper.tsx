"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function HeaderFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide global Navbar and Footer on dedicated app screens
  const isStandaloneApp = pathname?.startsWith("/chef") || 
                          pathname?.startsWith("/delivery") || 
                          pathname?.startsWith("/admin") || 
                          pathname?.startsWith("/sales") || 
                          pathname?.startsWith("/manager") || 
                          pathname?.startsWith("/login");

  return (
    <>
      {!isStandaloneApp && <Navbar />}
      <main className={`flex-1 flex flex-col ${!isStandaloneApp ? "pb-16 md:pb-0" : ""}`}>
        {children}
      </main>
      {!isStandaloneApp && <Footer />}
    </>
  );
}
