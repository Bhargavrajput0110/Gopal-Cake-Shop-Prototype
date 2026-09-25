"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    // If logged in and supported, ensure we are subscribed
    if (session?.user && isSupported && !subscription) {
      if (Notification.permission === 'granted') {
        subscribeUser();
      }
    }
  }, [session, isSupported, subscription]);

  async function registerServiceWorker() {
    try {
      // Register our custom push service worker
      await navigator.serviceWorker.register('/push-sw.js');
      
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        await saveSubscriptionToDb(existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker Registration Failed', error);
    }
  }

  async function subscribeUser() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.error("VAPID public key not found in env");
          return;
        }

        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        setSubscription(newSubscription);
        await saveSubscriptionToDb(newSubscription);
      }
    } catch (error) {
      console.error('Failed to subscribe user', error);
    }
  }

  async function saveSubscriptionToDb(sub: PushSubscription) {
    try {
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sub),
      });
    } catch (err) {
      console.error("Failed to save push subscription", err);
    }
  }

  if (isSupported && typeof window !== 'undefined' && window.Notification?.permission === 'default') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl z-[9999] flex items-center justify-between animate-in slide-in-from-bottom-5">
         <span className="text-sm font-bold">Enable Push Notifications</span>
         <button onClick={subscribeUser} className="bg-white text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-white/90">Enable</button>
      </div>
    );
  }

  return null;
}
