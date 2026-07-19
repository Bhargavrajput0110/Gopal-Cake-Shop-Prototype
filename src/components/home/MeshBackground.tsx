"use client";

import { motion } from "framer-motion";

export function MeshBackground() {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-background">
      
      {/* Dynamic Radial Mesh Blurs */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 50, 0],
          scale: [1, 1.2, 0.9, 1]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-[20%] -left-[10%] w-[60%] aspect-square bg-primary/10 rounded-full blur-[150px]"
      />

      <motion.div
        animate={{
          x: [0, -90, 60, 0],
          y: [0, 80, -40, 0],
          scale: [1.1, 0.9, 1.2, 1.1]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[40%] -right-[20%] w-[70%] aspect-square bg-primary/5 rounded-full blur-[160px]"
      />

      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 60, 0],
          scale: [0.9, 1.1, 0.85, 0.9]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-[10%] left-[20%] w-[50%] aspect-square bg-secondary/60 rounded-full blur-[120px]"
      />

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Vignette ring - lightened for pink theme */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,var(--background)_95%)]" />

    </div>
  );
}
