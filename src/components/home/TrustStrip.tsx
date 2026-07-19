"use client";

import React from "react";

const TRUST_ITEMS = [
  { icon: "⭐", text: "4.9 Rating — 50,000+ Reviews" },
  { icon: "🎂", text: "100% Eggless — Always" },
  { icon: "🏆", text: "Est. 1995 — 30 Years of Legacy" },
  { icon: "🚀", text: "Same-Day Delivery Available" },
  { icon: "🍫", text: "Belgian Chocolate Used" },
  { icon: "🌿", text: "No Preservatives — Baked Fresh Daily" },
  { icon: "📍", text: "4 Branches Across Vadodara" },
  { icon: "🎨", text: "Custom Designs from ₹499" },
];

const TrackItem = ({ item }: { item: typeof TRUST_ITEMS[number] }) => (
  <div className="flex items-center gap-3 px-8 shrink-0">
    <span className="text-base">{item.icon}</span>
    <span className="font-ui text-[11px] font-semibold tracking-[0.12em] uppercase text-white/80 whitespace-nowrap">
      {item.text}
    </span>
    <span className="w-1 h-1 rounded-full bg-[var(--brand-champagne)]/60 ml-2" />
  </div>
);

export function TrustStrip() {
  // Duplicate array for seamless looping
  const doubled = [...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <section className="relative w-full overflow-hidden border-y border-[var(--brand-champagne)]/20"
      style={{ background: "var(--brand-chocolate)" }}
    >
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--brand-chocolate), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--brand-chocolate), transparent)" }} />

      <div className="flex items-center py-4">
        <div
          className="flex animate-marquee-ltr"
          style={{ width: "max-content" }}
        >
          {doubled.map((item, i) => (
            <TrackItem key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
