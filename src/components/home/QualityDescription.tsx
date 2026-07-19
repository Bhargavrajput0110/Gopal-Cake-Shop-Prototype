"use client";

import { motion } from "framer-motion";
import NumberTicker from "@/components/magicui/NumberTicker";

const STATS = [
  { value: 1995, suffix: "", label: "Est. Year", sublabel: "Started in Vadodara" },
  { value: 30, suffix: "+", label: "Years of Craft", sublabel: "Three decades of excellence" },
  { value: 100, suffix: "%", label: "Eggless", sublabel: "No compromise, ever" },
  { value: 50, suffix: "K+", label: "Cakes Delivered", sublabel: "And counting every day" },
];

const PROCESS_STEPS = [
  { num: "01", title: "Select", desc: "Choose from 60+ categories or design your own." },
  { num: "02", title: "Craft", desc: "Our artisans bake fresh, on the day of delivery." },
  { num: "03", title: "Deliver", desc: "Same-day delivery across all of Vadodara." },
];

export function QualityDescription() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--brand-chocolate)" }}>
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(200,169,126,0.06)" }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(139,58,82,0.05)" }} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-32 md:py-44 relative z-10">

        {/* ── Editorial Quote ── */}
        <div className="mb-24 md:mb-36 max-w-[900px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-4 mb-8"
          >
            <div className="w-10 h-px bg-[var(--brand-champagne)]" />
            <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
              The Legacy
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display italic text-white leading-[1.08]"
            style={{ fontSize: "clamp(2rem, 4.5vw, 4.5rem)" }}
          >
            Since 1995, we haven&apos;t just baked cakes. We&apos;ve crafted{" "}
            <span className="text-[var(--brand-champagne)] not-italic">memories</span> using pure
            Belgian chocolate and uncompromising{" "}
            <span className="text-[var(--brand-champagne)] not-italic">passion.</span>
          </motion.h2>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-t border-white/10 mb-32">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col py-12 px-6 md:px-8 ${
                idx < 3 ? "border-b md:border-b-0 md:border-r border-white/10" : "border-b md:border-b-0"
              } group`}
            >
              {/* Number */}
              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-display font-bold text-[var(--brand-champagne)]"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>
                  <NumberTicker value={stat.value} className="text-[var(--brand-champagne)]" />
                </span>
                <span className="font-display font-bold text-[var(--brand-champagne)]"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 3rem)" }}>
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <span className="font-ui text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 mb-1">
                {stat.label}
              </span>
              <span className="font-editorial italic text-white/35 text-sm leading-snug">
                {stat.sublabel}
              </span>

              {/* Gold line on hover */}
              <div className="mt-6 w-0 group-hover:w-8 h-px bg-[var(--brand-champagne)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            </motion.div>
          ))}
        </div>

        {/* ── Process Strip ── */}
        <div className="border-t border-white/10 pt-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-10 h-px bg-[var(--brand-champagne)]/50" />
            <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-white/40 font-semibold">
              How It Works
            </span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {PROCESS_STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="flex flex-col md:pr-12 group"
              >
                <span className="font-display font-bold text-[var(--brand-champagne)]/20 text-7xl leading-none mb-4 group-hover:text-[var(--brand-champagne)]/40 transition-colors duration-500">
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-2xl text-white mb-3">
                  {step.title}
                </h3>
                <p className="font-editorial text-white/45 text-base leading-relaxed max-w-[240px]">
                  {step.desc}
                </p>
                {idx < PROCESS_STEPS.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-8 w-8 h-px bg-white/15" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
