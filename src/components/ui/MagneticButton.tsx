"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useAnimation, HTMLMotionProps } from "framer-motion";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  magneticRadius?: number;
  strength?: number;
}

export function MagneticButton({
  children,
  className = "",
  magneticRadius = 50,
  strength = 20,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      if (distance < magneticRadius + (rect.width / 2)) {
        setIsHovered(true);
        // Calculate pull (closer = stronger pull, up to 'strength' limit)
        const pullX = (distanceX / magneticRadius) * strength;
        const pullY = (distanceY / magneticRadius) * strength;
        
        controls.start({
          x: pullX,
          y: pullY,
          scale: 1.05,
          transition: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 }
        });
      } else {
        if (isHovered) {
          setIsHovered(false);
          controls.start({
            x: 0,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 200, damping: 20, mass: 0.5 }
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [controls, isHovered, magneticRadius, strength]);

  return (
    <motion.button
      ref={buttonRef}
      animate={controls}
      className={`relative group overflow-hidden ${className}`}
      {...props}
    >
      {/* Liquid Aura Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#8C3329] via-[#C47D35] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-md scale-110" />
      <div className="absolute inset-[1px] bg-[#2A1B16] rounded-full pointer-events-none transition-colors duration-500 group-hover:bg-[#2A1B16]/80" />
      
      {/* Content */}
      <span className="relative z-10 block transition-transform duration-500 group-hover:scale-105">
        {children}
      </span>
    </motion.button>
  );
}
