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
    <div className="w-full bg-[#D4AF37] py-6 overflow-hidden relative shadow-[0_0_30px_rgba(212,175,55,0.4)] z-20">
      <Marquee className="[--duration:15s]" pauseOnHover>
        {items.map((item, idx) => (
          <span key={idx} className={`font-black tracking-tighter uppercase text-[#050505] ${item === "✦" ? "text-white mx-8" : "text-4xl md:text-6xl mx-4"}`}>
            {item}
          </span>
        ))}
      </Marquee>
    </div>
  );
}
