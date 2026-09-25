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
      subscribeUser();
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

  return null; // This is a logic-only component
}
