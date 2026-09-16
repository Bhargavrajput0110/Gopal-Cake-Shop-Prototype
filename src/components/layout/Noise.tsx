"use client";

import { useEffect, useState } from "react";

export function Noise() {
  const [isMobileOrIOS, setIsMobileOrIOS] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      if (!isIOS && !isTouch) {
        setIsMobileOrIOS(false);
      }
    }
  }, []);

  // Bypassed on iOS & mobile to prevent WebKit feTurbulence / mix-blend GPU rendering crashes
  if (isMobileOrIOS) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.02] mix-blend-overlay">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          filter="url(#noiseFilter)"
        />
      </svg>
    </div>
  );
}
