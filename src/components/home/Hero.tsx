"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";

const FLOATING_WORDS = ["Artisanal", "Handcrafted", "Eggless", "Premium", "Fresh Daily"];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.35, 0.7]);

  return (
    <section
      ref={ref}
      className="relative w-full h-screen min-h-[700px] overflow-hidden flex flex-col justify-end"
      style={{ paddingTop: "36px" }} /* account for announcement bar */
    >
      {/* ── Video BG ── */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ willChange: "transform" }}
        >
          <source
            src="https://res.cloudinary.com/dfstyia4c/video/upload/v1784262667/making_an_cake_edit_to_put_it_uhmv3c.mp4"
            type="video/mp4"
          />
        </video>

        {/* Layer 1: Dark wash */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: overlayOpacity, backgroundColor: "#1C0F0A" }}
        />

        {/* Layer 2: Rose gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C0F0A] via-[#1C0F0A]/20 to-transparent" />

        {/* Layer 3: Vignette edges */}
        <div className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(28,15,10,0.55) 100%)"
          }}
        />

        {/* Layer 4: Champagne warm cast (subtle) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#C8A97E]/5 to-transparent mix-blend-screen" />
      </div>

      {/* ── Floating words — decorative background text ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {FLOATING_WORDS.map((word, i) => (
          <motion.span
            key={word}
            className="absolute font-display text-white/[0.025] select-none whitespace-nowrap"
            style={{
              fontSize: `${8 + i * 2}vw`,
              top: `${8 + i * 18}%`,
              left: i % 2 === 0 ? "-5%" : "auto",
              right: i % 2 !== 0 ? "-5%" : "auto",
            }}
            animate={{ x: i % 2 === 0 ? [0, 20, 0] : [0, -20, 0] }}
            transition={{ duration: 18 + i * 3, repeat: Infinity, ease: "linear" }}
          >
            {word}
          </motion.span>
        ))}
      </div>

      {/* ── Hero Content ── */}
      <motion.div
        className="relative z-10 flex flex-col justify-end pb-16 md:pb-24 px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto w-full"
        style={{ y: textY }}
      >
        {/* Tag line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center gap-3 mb-6 md:mb-8"
        >
          <span className="block w-8 h-px bg-[var(--brand-champagne)]" />
          <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
            Est. 1995 · Vadodara, Gujarat
          </span>
        </motion.div>

        {/* Main headline */}
        <div className="overflow-hidden mb-2">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-white leading-[0.88] tracking-tight"
            style={{
              fontSize: "clamp(4rem, 13vw, 14rem)",
              lineHeight: 0.88,
            }}
          >
            GOPAL
          </motion.h1>
        </div>

        <div className="overflow-hidden mb-8 md:mb-12">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline gap-4 md:gap-6"
          >
            <h2
              className="font-display italic font-light text-[var(--brand-champagne)] leading-[0.88]"
              style={{ fontSize: "clamp(2.5rem, 8vw, 9rem)", lineHeight: 0.88 }}
            >
              Cakes
            </h2>
          </motion.div>
        </div>

        {/* Bottom row: Description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12"
        >
          {/* Description */}
          <p className="font-editorial text-white/55 text-base md:text-lg max-w-xs leading-relaxed">
            Handcrafted daily. 100% eggless. For every celebration in Vadodara.
          </p>

          {/* CTA group */}
          <div className="flex items-center gap-4">
            <Link href="/menu">
              <button className="btn-primary px-8 py-4 text-[11px]">
                Order Now
              </button>
            </Link>
            <Link href="/custom">
              <button className="btn-secondary px-8 py-4 text-[11px]">
                Customize
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute right-6 md:right-12 bottom-0 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/30 to-white/60" />
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              className="w-4 h-4 text-white/50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Right side floating stats chip ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-1/2 right-6 md:right-12 -translate-y-1/2 z-10 hidden lg:flex flex-col gap-3"
      >
        {[
          { num: "50K+", label: "Happy Customers" },
          { num: "30+", label: "Years of Craft" },
          { num: "4", label: "City Branches" },
        ].map((stat) => (
          <div
            key={stat.num}
            className="glass-dark rounded-2xl px-5 py-4 flex flex-col items-center text-center min-w-[100px] border border-white/10"
          >
            <span className="font-display text-2xl font-bold text-[var(--brand-champagne)]">
              {stat.num}
            </span>
            <span className="font-ui text-[9px] tracking-[0.15em] uppercase text-white/50 mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Gold thin line at bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-[var(--brand-champagne)]/40 to-transparent" />
    </section>
  );
}
