"use client";

import Marquee from "@/components/magicui/Marquee";

const items = [
  "100% EGGLESS", "✦",
  "PREMIUM CHOCOLATE", "✦", 
  "SAME DAY DELIVERY", "✦",
  "CUSTOM DESIGNS", "✦",
  "FRESHLY BAKED", "✦"
];

export function InfiniteCarousel() {
  return (
    <div className="w-full bg-background py-6 overflow-hidden relative z-20 border-b border-border/50">
      <Marquee className="[--duration:15s]" pauseOnHover>
        {items.map((item, idx) => (
          <span key={idx} className={`font-black tracking-tighter uppercase text-foreground ${item === "✦" ? "opacity-30 mx-8 text-primary" : "text-4xl md:text-6xl mx-4"}`}>
            {item}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
