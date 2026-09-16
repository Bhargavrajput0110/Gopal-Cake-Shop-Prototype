"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis } from 'lenis/react';

export function SmoothScroller({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                          /Macintosh/.test(ua);
      const isTouch = window.matchMedia('(pointer: coarse)').matches;

      // Only enable Lenis smooth scrolling on Desktop non-touch browsers
      if (!isIOSDevice && !isTouch) {
        setEnabled(true);
      }
    }
  }, []);
  
  // Disable Lenis smooth scrolling on app dashboards and iOS/touch devices
  const isStandaloneApp = pathname?.startsWith("/chef") || 
                          pathname?.startsWith("/driver") || 
                          pathname?.startsWith("/delivery") || 
                          pathname?.startsWith("/admin") || 
                          pathname?.startsWith("/sales") || 
                          pathname?.startsWith("/manager") || 
                          pathname?.startsWith("/vendor") || 
                          pathname?.startsWith("/login");

  if (isStandaloneApp || !enabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ lerp: 0.12, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
