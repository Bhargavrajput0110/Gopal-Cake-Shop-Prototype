"use client";

import { motion, useScroll, useTransform } from "framer-motion";

export function PageColorWrapper({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  
  // Transition from dark chocolate (#1C0F0A) to warm cream (#FDFBF7)
  const backgroundColor = useTransform(
    scrollY,
    [0, 500, 900],
    ["#1C0F0A", "#1C0F0A", "#FDFBF7"]
  );

  // Transition text from cream (#FDFBF7) to dark chocolate (#1C0F0A)
  const color = useTransform(
    scrollY,
    [0, 500, 900],
    ["#FDFBF7", "#FDFBF7", "#1C0F0A"]
  );

  return (
    <motion.div
      className="flex flex-col min-h-screen relative transition-colors duration-100 ease-out"
      style={{ backgroundColor, color }}
    >
      {children}
    </motion.div>
  );
}
