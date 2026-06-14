"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Prevent scrolling while preloader is active
    document.body.style.overflow = "hidden";
    
    const timer = setTimeout(() => {
      setIsLoading(false);
      document.body.style.overflow = "unset";
      window.scrollTo(0, 0);
    }, 2800); // 2.8 seconds cinematic intro

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]"
        >
          <div className="flex flex-col items-center justify-center">
            {/* Elegant SVG Path drawing animation */}
            <svg
              width="300"
              height="100"
              viewBox="0 0 300 100"
              className="mb-8"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="2"
            >
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                // Abstract elegant path (could be a cake silhouette or fancy G)
                d="M 50 50 C 50 20 100 20 100 50 C 100 80 150 80 150 50 C 150 20 200 20 200 50 C 200 80 250 80 250 50"
              />
            </svg>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="overflow-hidden"
            >
              <h1 className="font-heading text-4xl tracking-[0.3em] text-white font-light">
                GOPAL<span className="text-[#D4AF37] font-bold">CAKES</span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
              className="h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-8"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
