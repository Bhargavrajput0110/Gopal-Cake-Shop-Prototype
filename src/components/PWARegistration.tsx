'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister any stale / broken service workers (like old workbox or sw.js)
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.active?.scriptURL && !reg.active.scriptURL.endsWith('/sw-custom.js')) {
            reg.unregister().catch(() => {});
          }
        }
      }).catch(() => {});

      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw-custom.js')
          .then((reg) => {
            console.log('Custom Service Worker registered: ', reg);
          })
          .catch((err) => {
            console.error('Custom Service Worker registration failed: ', err);
          });
      });
    }
  }, []);

  return null;
}
