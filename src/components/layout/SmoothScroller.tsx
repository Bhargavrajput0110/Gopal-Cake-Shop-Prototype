"use client";

import { usePathname } from 'next/navigation';
import { ReactLenis } from 'lenis/react';

export function SmoothScroller({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Disable Lenis smooth scrolling on app dashboards since they use native overflow panels
  const isStandaloneApp = pathname?.startsWith("/chef") || 
                          pathname?.startsWith("/driver") || 
                          pathname?.startsWith("/delivery") || 
                          pathname?.startsWith("/admin") || 
                          pathname?.startsWith("/sales") || 
                          pathname?.startsWith("/manager") || 
                          pathname?.startsWith("/vendor") || 
                          pathname?.startsWith("/login");

  if (isStandaloneApp) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
