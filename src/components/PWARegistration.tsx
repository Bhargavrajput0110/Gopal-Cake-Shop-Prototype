'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
