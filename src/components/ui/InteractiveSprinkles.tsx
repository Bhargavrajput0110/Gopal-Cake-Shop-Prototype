"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, MotionValue } from "framer-motion";

const SPRINKLE_COLORS = ["#8C3329", "#C47D35", "#D4AF37", "#4A3B32", "#E8D5C4"];
const SPRINKLE_COUNT = 35;

interface SprinkleData {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  depth: number; 
  speed: number;
}

function SprinkleItem({
  sprinkle,
  smoothMouseX,
  smoothMouseY,
  smoothGlobalScrollY,
}: {
  sprinkle: SprinkleData;
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  smoothGlobalScrollY: MotionValue<number>;
}) {
  const xOffset = useTransform(smoothMouseX, [-0.5, 0.5], [sprinkle.depth * -150, sprinkle.depth * 150]);
  const yMouseOffset = useTransform(smoothMouseY, [-0.5, 0.5], [sprinkle.depth * -150, sprinkle.depth * 150]);
  const scrollOffset = useTransform(smoothGlobalScrollY, (val) => val * sprinkle.depth);
  const yOffset = useTransform(() => yMouseOffset.get() + scrollOffset.get());

  return (
    <motion.div
      style={{
        x: xOffset,
        y: yOffset,
      }}
      className="absolute shadow-sm"
    >
      <motion.div
        animate={{
          y: [0, -30, 0],
          rotate: [sprinkle.rotation, sprinkle.rotation + 45, sprinkle.rotation],
        }}
        transition={{
          duration: sprinkle.speed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          left: `${sprinkle.x}vw`,
          top: `${sprinkle.y}vh`,
          width: `${12 * sprinkle.scale}px`,
          height: `${36 * sprinkle.scale}px`,
          backgroundColor: sprinkle.color,
          borderRadius: "9999px",
          opacity: sprinkle.depth * 0.8,
          filter: `blur(${sprinkle.depth < 0.4 ? '3px' : '0px'})`,
        }}
      />
    </motion.div>
  );
}

export function InteractiveSprinkles() {
  const [sprinkles, setSprinkles] = useState<SprinkleData[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const { scrollYProgress } = useScroll();
  const globalScrollY = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const smoothGlobalScrollY = useSpring(globalScrollY, { stiffness: 40, damping: 15 });

  useEffect(() => {
    const generated: SprinkleData[] = [];
    for (let i = 0; i < SPRINKLE_COUNT; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: Math.random() * 0.8 + 0.4,
        color: SPRINKLE_COLORS[Math.floor(Math.random() * SPRINKLE_COLORS.length)],
        depth: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 20 + 10,
      });
    }
    setSprinkles(generated);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  if (sprinkles.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {sprinkles.map((sprinkle) => (
        <SprinkleItem
          key={sprinkle.id}
          sprinkle={sprinkle}
          smoothMouseX={smoothMouseX}
          smoothMouseY={smoothMouseY}
          smoothGlobalScrollY={smoothGlobalScrollY}
        />
      ))}
    </div>
  );
}
