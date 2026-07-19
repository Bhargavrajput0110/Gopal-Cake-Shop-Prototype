"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Animate progress counter
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 18;
      });
    }, 120);

    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = "unset";
      window.scrollTo(0, 0);
    }, 2600);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            clipPath: "inset(0% 0% 100% 0%)",
          }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
          style={{ background: "#1C0F0A" }}
        >
          {/* Ambient glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[180px] pointer-events-none"
            style={{ background: "rgba(200,169,126,0.08)" }} />

          {/* ── Logo ── */}
          <div className="relative flex flex-col items-center">
            {/* Crown / ornament SVG */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mb-6"
            >
              <svg width="52" height="40" viewBox="0 0 52 40" fill="none">
                <path
                  d="M4 36 L4 20 L16 28 L26 4 L36 28 L48 20 L48 36 Z"
                  stroke="#C8A97E"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="26" cy="4" r="2.5" fill="#C8A97E" />
                <circle cx="4" cy="20" r="2.5" fill="#C8A97E" />
                <circle cx="48" cy="20" r="2.5" fill="#C8A97E" />
              </svg>
            </motion.div>

            {/* Wordmark: GOPAL */}
            <div className="overflow-hidden">
              <motion.span
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="block font-display font-bold text-white tracking-[0.25em] text-5xl md:text-6xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                GOPAL
              </motion.span>
            </div>

            {/* Sub: CAKES & SWEETS */}
            <motion.div
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 1.2, delay: 0.6 }}
              className="overflow-hidden mt-2"
            >
              <span
                className="block font-ui font-semibold text-[11px] uppercase tracking-[0.4em] text-center"
                style={{ color: "#C8A97E", fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                Cakes & Sweets
              </span>
            </motion.div>

            {/* Gold line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 origin-left"
              style={{ height: "1px", width: "160px", background: "linear-gradient(90deg, transparent, #C8A97E, transparent)" }}
            />

            {/* Progress line */}
            <div className="mt-8 relative w-40 h-px bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 origin-left"
                style={{ background: "#C8A97E" }}
                animate={{ scaleX: Math.min(progress / 100, 1) }}
                transition={{ duration: 0.2, ease: "linear" }}
              />
            </div>

            {/* Progress counter */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.4 }}
              className="mt-3 font-ui text-[10px] tracking-[0.25em] text-white/40 tabular-nums"
            >
              {Math.min(Math.round(progress), 100).toString().padStart(3, "0")}
            </motion.span>
          </div>

          {/* Est. year bottom */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute bottom-10 font-ui text-[9px] tracking-[0.5em] uppercase text-white"
          >
            Est. 1995 · Vadodara
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
