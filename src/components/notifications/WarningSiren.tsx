"use client";

import { useEffect, useState, useRef } from "react";
import { useOrders } from "@/context/OrderContext";
import { useSession } from "next-auth/react";
import { toBranchId } from "@/lib/branches";
import { VolumeHigh, VolumeSlash } from "iconsax-react";

export function WarningSiren() {
  const { data: session } = useSession();
  const { orders } = useOrders();
  const [sirenActive, setSirenActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioCtx = useRef<AudioContext | null>(null);

  const userRole = ((session?.user as any)?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const userBranchId = (session?.user as any)?.branchId || (session?.user as any)?.branch;
  const canonicalUserBranch = userBranchId ? toBranchId(userBranchId) : null;

  // 1. Unlock Audio Context on first user interaction
  useEffect(() => {
    const unlock = () => {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }
      setAudioUnlocked(true);
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    
    // Check if it's already running
    if (audioCtx.current && audioCtx.current.state === "running") {
      setAudioUnlocked(true);
    }
    
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

        // Filter by branch for non-admins
        if (!isAdmin && canonicalUserBranch && toBranchId(o.branch) !== canonicalUserBranch) {
          return false;
        }

        // For chefs, only WAITING_FOR_CHEF (new unaccepted orders due soon) should trigger the siren
        if (userRole === "CHEF" && o.status !== "WAITING_FOR_CHEF") {
          return false;
        }
        
        // Ignore orders that are already being worked on or completed
        const ignoreStatuses = [
          "CHEF_ACCEPTED",
          "MAKING",
          "DECORATING",
          "ASSIGNED_TO_DRIVER",
          "COMPLETED",
          "DELIVERED",
          "CANCELLED",
          "FAILED_DELIVERY",
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
  }, [orders, isAdmin, canonicalUserBranch, userRole]);

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

  if (!audioUnlocked) {
    return (
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 cursor-pointer animate-bounce"
        title="Tap anywhere to enable siren & audio alerts"
      >
        <span className="text-xl">🔔</span>
        <span className="font-black text-xs uppercase tracking-widest">Tap anywhere to enable alerts</span>
      </div>
    );
  }

  if (!sirenActive) return null;

  return (
    <div className="fixed top-2 right-3 z-[99999] bg-rose-600 text-white px-3.5 py-1.5 md:px-5 md:py-2 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse flex items-center gap-2 border-2 border-rose-400">
      <span className="font-black tracking-wider text-[11px] md:text-xs uppercase flex items-center gap-1.5">
        <span className="text-base">🚨</span> 
        1-Hour SLA Warning!
      </span>
      <button 
        onClick={() => setIsMuted(!isMuted)} 
        className="p-1 bg-black/30 rounded-full hover:bg-black/50 transition-colors"
        title={isMuted ? "Unmute Siren" : "Mute Siren"}
      >
        {isMuted ? <VolumeSlash size={16} variant="Bold" /> : <VolumeHigh size={16} variant="Bold" />}
      </button>
    </div>
  );
}
