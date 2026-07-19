"use client";

import { motion } from "framer-motion";
import { Star1 } from "iconsax-react";

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    location: "Alkapuri, Vadodara",
    rating: 5,
    text: "Absolutely stunning wedding cake! Every single guest asked where it was from. The fondant work was flawless and it tasted as beautiful as it looked. Gopal never disappoints.",
    cake: "4-Tier Royal Wedding Cake",
    initial: "P",
    color: "#8B3A52",
  },
  {
    name: "Rohan Mehta",
    location: "Fatehganj, Vadodara",
    rating: 5,
    text: "Ordered a custom Superman cake for my son's 5th birthday. They nailed every detail — he was speechless! Delivered 30 minutes before the party. Will always come back here.",
    cake: "Custom Superman Theme",
    initial: "R",
    color: "#C8A97E",
  },
  {
    name: "Neha Patel",
    location: "Manjalpur, Vadodara",
    rating: 5,
    text: "The Belgian chocolate ganache cake was life-changing. Rich, moist, not too sweet. And they deliver all the way to Manjalpur! 100% eggless and still this amazing. Truly the best.",
    cake: "Belgian Chocolate Ganache",
    initial: "N",
    color: "#2A1810",
  },
  {
    name: "Arjun Kapoor",
    location: "Sayajigunj, Vadodara",
    rating: 5,
    text: "Ordered a bento cake for my wife's anniversary — the smallest cake I've ever seen and somehow the most beautiful. She cried happy tears. Gopal Cakes = magic.",
    cake: "Bento Anniversary Cake",
    initial: "A",
    color: "#8B3A52",
  },
  {
    name: "Kavya Desai",
    location: "Gorwa, Vadodara",
    rating: 5,
    text: "Been ordering from Gopal for 8 years. Quality never drops. Same-day delivery has saved me so many times. Their fresh flower cakes are breathtaking. No one else comes close.",
    cake: "Fresh Flower Cake",
    initial: "K",
    color: "#C8A97E",
  },
  {
    name: "Mihir Shah",
    location: "Akota, Vadodara",
    rating: 5,
    text: "Had a custom photo cake made for my mom's 60th birthday. The edible print was crystal clear, and the vanilla sponge was heavenly. Great pricing for the quality you get!",
    cake: "Vintage Photo Cake",
    initial: "M",
    color: "#2A1810",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star1 key={i} className="w-3.5 h-3.5 fill-[var(--brand-champagne)] text-[var(--brand-champagne)]" />
      ))}
    </div>
  );
}

function ReviewCard({ review, idx }: { review: typeof TESTIMONIALS[number]; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: (idx % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-3xl p-7 md:p-8 border border-[var(--border)] bg-white hover:border-[var(--brand-champagne)]/50 hover:shadow-[0_20px_60px_rgba(200,169,126,0.1)] transition-all duration-500 group"
    >
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl"
        style={{ background: "linear-gradient(90deg, transparent, var(--brand-champagne), transparent)", opacity: 0 }}
        // opacity set via group-hover in tailwind below
      />
      <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "linear-gradient(90deg, transparent, rgba(200,169,126,0.6), transparent)" }} />

      {/* Stars */}
      <StarRating count={review.rating} />

      {/* Quote */}
      <p className="font-editorial italic text-[var(--foreground)]/75 text-base leading-relaxed mt-5 mb-7 flex-1">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Cake type */}
      <div className="mb-5">
        <span className="badge-glass text-[var(--brand-deep-rose)] text-[9px]">
          {review.cake}
        </span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-5">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-ui font-bold text-base flex-shrink-0"
          style={{ background: review.color }}
        >
          {review.initial}
        </div>
        <div>
          <p className="font-ui font-semibold text-[var(--foreground)] text-sm leading-tight">
            {review.name}
          </p>
          <p className="font-ui text-[var(--muted-foreground)] text-[11px] mt-0.5">
            {review.location}
          </p>
        </div>
        <div className="ml-auto">
          <svg className="w-5 h-5 text-[var(--muted-foreground)]/30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-28 md:py-36 bg-[var(--muted)]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">

        {/* ── Header ── */}
        <div className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-px bg-[var(--brand-champagne)]" />
              <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
                What They Say
              </span>
            </div>
            <h2 className="font-display font-bold text-[var(--foreground)] leading-[0.92]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>
              Real Stories,
              <span className="block font-display italic font-normal text-[var(--brand-deep-rose)]">
                Real Smiles
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-6 self-start md:self-auto">
            <div className="flex flex-col items-end">
              <span className="font-display font-bold text-4xl text-[var(--foreground)]">4.9</span>
              <div className="flex mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star1 key={i} className="w-4 h-4 fill-[var(--brand-champagne)] text-[var(--brand-champagne)]" />
                ))}
              </div>
              <span className="font-ui text-[10px] text-[var(--muted-foreground)] mt-1.5 tracking-wide">
                50,000+ reviews
              </span>
            </div>
          </div>
        </div>

        {/* ── Review Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {TESTIMONIALS.map((review, idx) => (
            <ReviewCard key={review.name} review={review} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
