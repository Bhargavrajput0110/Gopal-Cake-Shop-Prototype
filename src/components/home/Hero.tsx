"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight2 } from "iconsax-react";

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
      className="relative w-full min-h-screen overflow-hidden flex flex-col pt-28 md:pt-36"
    >
      {/* ── Video BG (Blended 3 Reels Panorama) ── */}
      <div className="absolute inset-0 z-0 bg-black">
        {/* Reel 1 (Left - Mobile & Desktop) */}
        <div className="absolute left-0 top-0 bottom-0 w-full md:w-[40%]">
          <video
            key="hero-video-1"
            src="https://res.cloudinary.com/dlxiy6aiq/video/upload/v1788199517/AQM9Inm1bmMqgSvwXR7hyWhekGAxwHeGAdfcJl2VK11H-REpvhuerjjmqXEewNu8bNeTQT6UfVFi5ydfrNne_p5H2k2M9tym2VKIGdQ_qtxv59.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ willChange: "transform" }}
          />
        </div>

        {/* Reel 2 (Center - Desktop only) */}
        <div className="absolute left-[30%] top-0 bottom-0 w-[40%] hidden md:block">
          <video
            key="hero-video-2"
            src="https://res.cloudinary.com/dlxiy6aiq/video/upload/v1788199841/AQOHIt8uZ1_bH9jYzCiwBjGg4ptZXXI6m4kTonsE2CxvPYMCqNMj4YoMzDkEd2gffHdQZj8yPTR1ViT30oNyTIh3Zw2xK9SUtDFZqJo_xu8ojk.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ 
              willChange: "transform",
              maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)"
            }}
          />
        </div>

        {/* Reel 3 (Right - Desktop only) */}
        <div className="absolute left-[60%] top-0 bottom-0 w-[40%] hidden md:block">
          <video
            key="hero-video-3"
            src="https://res.cloudinary.com/dlxiy6aiq/video/upload/v1788200368/AQMloeSiiyrth-BpVCvrNtbiPKKhPh1_2q7v4eUzmZ7IUMs782jtizsW0WHITJap8etK4uYEIdLdr016Onbm1KsGEEOBragRV6LLFhA_1_dzohnj.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
            style={{ 
              willChange: "transform",
              maskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 25%, black 100%)"
            }}
          />
        </div>

        {/* Layer 1: Neutral dark wash */}
        <motion.div
          className="absolute inset-0"
          style={{ opacity: overlayOpacity, backgroundColor: "#000000" }}
        />

        {/* Layer 2: Strong left gradient for text contrast & hierarchy */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent w-full md:w-[80%]" />

        {/* Layer 3: Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>


      {/* ── Hero Content ── */}
      <motion.div
        className="relative z-10 flex flex-col mt-auto pb-16 md:pb-24 px-6 md:px-12 lg:px-20 max-w-[1440px] mx-auto w-full"
        style={{ y: textY }}
      >
        {/* Tag line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="inline-flex items-center gap-3 mb-6 md:mb-8 bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/10 self-start shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]"
        >
          {/* Pulsating dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-champagne)] opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-champagne)]"></span>
          </span>
          <span className="font-ui text-[11px] tracking-[0.2em] uppercase text-[var(--brand-champagne)] font-bold drop-shadow-sm">
            Est. 1990 · Vadodara
          </span>
        </motion.div>

        {/* Main headline */}
        <div className="-mb-2 md:-mb-4">
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-white leading-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
            style={{
              fontSize: "clamp(3.5rem, 12vw, 13rem)",
            }}
          >
            Gopal
          </motion.h1>
        </div>

        <div className="mb-6 md:mb-10">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-baseline gap-4 md:gap-6"
          >
            <h2
              className="font-display text-[var(--brand-champagne)] leading-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] lowercase"
              style={{ fontSize: "clamp(3rem, 10vw, 11rem)" }}
            >
              cakes
            </h2>
          </motion.div>
        </div>

        {/* Bottom Section: Description, CTA, and Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mt-4 w-full"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12">
            {/* Description */}
            <p className="font-editorial text-white/90 text-base md:text-lg max-w-xs leading-relaxed drop-shadow-md">
              Handcrafted daily. 100% eggless. For every celebration in Vadodara.
            </p>

            {/* CTA group */}
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/menu" className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--brand-deep-rose)] to-[#9a425a] hover:from-[#9a425a] hover:to-[var(--brand-deep-rose)] text-white px-7 md:px-8 py-3.5 md:py-4 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-500 shadow-[0_8px_32px_rgba(139,58,82,0.3)] hover:shadow-[0_8px_32px_rgba(139,58,82,0.5)] hover:-translate-y-0.5">
                <span>Order Now</span>
                <ArrowRight2 variant="Bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link href="/custom" className="group flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white px-7 md:px-8 py-3.5 md:py-4 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-500 hover:-translate-y-0.5">
                <span>Customize</span>
              </Link>
            </div>
          </div>

          {/* Stats Grouped inside the bottom layout instead of floating */}
          <div className="hidden lg:flex items-center gap-2 bg-white/5 backdrop-blur-xl p-5 px-8 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            {[
              { num: "50K+", label: "Happy Customers" },
              { num: "30+", label: "Years of Craft" },
              { num: "4", label: "City Branches" },
            ].map((stat, i) => (
              <div key={stat.num} className="flex items-center">
                {i > 0 && <div className="w-px h-10 bg-white/10 mx-6" />}
                <div className="flex flex-col items-center text-center">
                  <span className="font-display text-2xl font-bold text-white tracking-wide shadow-black/50 drop-shadow-sm">
                    {stat.num}
                  </span>
                  <span className="font-ui text-[9px] tracking-[0.2em] uppercase text-[var(--brand-champagne)] mt-1.5 whitespace-nowrap">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* ── Gold thin line at bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-gradient-to-r from-transparent via-[var(--brand-champagne)]/40 to-transparent" />
    </section>
  );
}
