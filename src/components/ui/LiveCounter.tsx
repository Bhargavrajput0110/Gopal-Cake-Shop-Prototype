"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveCounterProps {
  initialValue?: number;
}

export function LiveCounter({ initialValue = 12450 }: LiveCounterProps) {
  const [count, setCount] = useState(initialValue);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    // Randomly tick up every 3-8 seconds
    const interval = setInterval(() => {
      setCount((prev) => prev + 1);
      setIsFlashing(true);
      
      setTimeout(() => {
        setIsFlashing(false);
      }, 500); // flash duration
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative transition-colors duration-500 rounded-xl p-4 overflow-hidden ${isFlashing ? "bg-white/20" : "bg-transparent"}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isFlashing ? "bg-green-400" : "bg-[#8C3329]"} transition-colors duration-300 animate-pulse`} />
        <span className="text-[#2A1B16]/60 text-[9px] font-sans font-bold uppercase tracking-[0.2em]">Live Orders Delivered</span>
      </div>
      
      <div className="flex items-baseline gap-1 font-sans">
        <div className="flex overflow-hidden h-12 md:h-14">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={count}
              initial={{ y: "100%", opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: "-100%", opacity: 0, rotateX: 90 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformOrigin: "bottom center" }}
              className="text-4xl md:text-5xl font-black text-[#2A1B16] drop-shadow-sm flex"
            >
              {count.toLocaleString()}
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="text-[#C47D35] font-black text-2xl">+</span>
      </div>
    </div>
  );
}
