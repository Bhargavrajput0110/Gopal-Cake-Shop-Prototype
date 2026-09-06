"use client";

import React from "react";

const TRUST_ITEMS = [
  "100% EGGLESS",
  "HANDCRAFTED IN VADODARA",
  "PREMIUM INGREDIENTS",
  "ESTABLISHED 1990",
  "NO PRESERVATIVES",
];

const TrackItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-6 px-6 shrink-0">
    <span className="font-ui text-sm md:text-base font-medium tracking-[0.2em] text-[#C8A97E] whitespace-nowrap">
      {text}
    </span>
    <span className="text-[#C8A97E]/50 text-lg">✦</span>
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
          {doubled.map((text, i) => (
            <TrackItem key={i} text={text} />
          ))}
        </div>
      </div>
    </section>
  );
}
