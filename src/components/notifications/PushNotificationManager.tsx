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
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      registerServiceWorker();
    }
  }, []);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (session?.user && isSupported && permission === 'granted' && !isSubscribed) {
      silentSubscribe();
    }
  }, [session, isSupported, permission, isSubscribed]);

  async function registerServiceWorker() {
    try {
      await navigator.serviceWorker.register('/push-sw.js');
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setIsSubscribed(true);
        await saveSubscriptionToDb(existingSubscription);
      }
    } catch (error) {
      console.error('Service Worker Registration Failed', error);
    }
  }

  async function silentSubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) return;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      setIsSubscribed(true);
      await saveSubscriptionToDb(sub);
    } catch (e) {
      console.error('Silent subscribe failed', e);
    }
  }

  async function handleEnable() {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          setStatusMsg('Config error — contact admin.');
          setIsLoading(false);
          return;
        }
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
        setIsSubscribed(true);
        await saveSubscriptionToDb(sub);
        setStatusMsg('✅ Notifications enabled!');
        setTimeout(() => setIsDismissed(true), 2000);
      } else if (result === 'denied') {
        setStatusMsg('❌ Blocked in browser settings.');
      } else {
        setStatusMsg('Permission not granted.');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setStatusMsg('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSubscriptionToDb(sub: PushSubscription) {
    try {
      await fetch('/api/v1/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    } catch (err) {
      console.error('Failed to save push subscription', err);
    }
  }

  // Hide if: not supported, already subscribed, dismissed, or permission denied
  if (!isSupported || isSubscribed || isDismissed || permission === 'denied') {
    return null;
  }

  // Hide if permission already granted (will auto-subscribe silently)
  if (permission === 'granted') {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl z-[99999] flex flex-col gap-2 animate-in slide-in-from-bottom-5"
      style={{ pointerEvents: 'all' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black">🔔 Enable Push Notifications</p>
          <p className="text-xs opacity-75">Get alerts for new orders on your phone</p>
        </div>
        <button
          onClick={handleEnable}
          disabled={isLoading}
          className="shrink-0 bg-white text-primary px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-wait transition-all active:scale-95"
        >
          {isLoading ? '...' : 'ENABLE'}
        </button>
      </div>
      {statusMsg && (
        <p className="text-xs font-bold opacity-90 text-center bg-black/20 rounded-xl py-1.5 px-3">{statusMsg}</p>
      )}
      <button
        onClick={() => setIsDismissed(true)}
        className="text-[10px] opacity-50 hover:opacity-100 text-center underline transition-opacity"
      >
        Dismiss
      </button>
    </div>
  );
}
