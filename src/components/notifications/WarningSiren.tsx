"use client";

import { useEffect, useState, useRef } from "react";
import { useOrders } from "@/context/OrderContext";
import { VolumeHigh, VolumeSlash } from "iconsax-react";

export function WarningSiren() {
  const { orders } = useOrders();
  const [sirenActive, setSirenActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  // 1. Unlock Audio Context on first user interaction
  useEffect(() => {
    const unlock = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  // 2. Check for orders within the 1-hour SLA window
  useEffect(() => {
    const checkDeadlines = () => {
      const now = Date.now();
      const isUrgent = orders.some((o) => {
        if (!o.timeTarget) return false;
        
        // Ignore orders that are already fully completed or ready
        const ignoreStatuses = [
          "COMPLETED",
          "DELIVERED",
          "CANCELLED",
          "FAILED_DELIVERY",
          "READY_FOR_PICKUP",
          "PICKED_UP",
          "QUOTE_DRAFT",
          "QUOTE_SENT",
          "QUOTE_EXPIRED",
          "QUOTE_REJECTED",
          "DRAFT",
        ];
        if (ignoreStatuses.includes(o.status)) return false;

        const target = new Date(o.timeTarget).getTime();
        const msLeft = target - now;

        // True if the order is due in exactly 60 minutes or less (and not overdue by more than 2 hours to avoid stale alarms)
        return msLeft > -7200000 && msLeft <= 3600000;
      });

      setSirenActive(isUrgent);
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [orders]);

  // 3. Play the siren sound periodically if active
  useEffect(() => {
    if (!sirenActive || isMuted) return;

    const playSiren = () => {
      if (!audioCtx.current) return;
      if (audioCtx.current.state === "suspended") audioCtx.current.resume();

      try {
        const ctx = audioCtx.current;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        // Ambulance wail effect (High-Low)
        const now = ctx.currentTime;
        
        osc1.type = "square";
        osc2.type = "triangle";
        
        // Sweep up and down
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.linearRampToValueAtTime(800, now + 0.3);
        osc1.frequency.linearRampToValueAtTime(600, now + 0.6);
        osc1.frequency.linearRampToValueAtTime(800, now + 0.9);
        osc1.frequency.linearRampToValueAtTime(600, now + 1.2);

        osc2.frequency.setValueAtTime(605, now); // Slight detune for dissonance
        osc2.frequency.linearRampToValueAtTime(805, now + 0.3);
        osc2.frequency.linearRampToValueAtTime(605, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(805, now + 0.9);
        osc2.frequency.linearRampToValueAtTime(605, now + 1.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.2);
        osc2.stop(now + 1.2);
      } catch (e) {
        console.error("Audio play failed:", e);
      }
    };

    // Play immediately, then every 8 seconds
    playSiren();
    const intervalId = setInterval(playSiren, 8000);

    return () => clearInterval(intervalId);
  }, [sirenActive, isMuted]);

  if (!sirenActive) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] bg-rose-600 text-white px-5 py-2 md:px-8 md:py-3 rounded-full shadow-[0_0_30px_rgba(225,29,72,0.8)] animate-pulse flex items-center gap-4 border-4 border-rose-400">
      <span className="font-black tracking-widest text-xs md:text-sm uppercase flex items-center gap-2">
        <span className="text-xl md:text-2xl">🚨</span> 
        1-Hour SLA Warning!
      </span>
      <button 
        onClick={() => setIsMuted(!isMuted)} 
        className="p-2 md:p-3 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
        title={isMuted ? "Unmute Siren" : "Mute Siren"}
      >
        {isMuted ? <VolumeSlash size={24} variant="Bold" /> : <VolumeHigh size={24} variant="Bold" />}
      </button>
    </div>
  );
}
