'use client';

import { useEffect } from 'react';

export function GlobalScrollDisabler() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if the currently focused element is a number input
      if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
        // Blur the input to completely prevent the wheel from changing the value
        // Alternatively, preventDefault could be used but blurring is more robust across browsers
        // to stop the native value increment/decrement.
        document.activeElement.blur();
      }
    };

    // Use passive: false to ensure we can intercept the wheel if needed
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return null;
}
