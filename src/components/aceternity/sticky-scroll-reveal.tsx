"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const StickyScroll = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    description: string | React.ReactNode | any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight;
      const elements = document.querySelectorAll(".sticky-text-block");
      let closestIndex = 0;
      let minDistance = Infinity;

      elements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        // Calculate distance from center of viewport
        const distance = Math.abs(rect.top + rect.height / 2 - vh / 2);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setActiveCard(closestIndex);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Init
    return () => window.removeEventListener("scroll", handleScroll);
  }, [content.length]);

  return (
    <div className="flex w-full relative bg-[#050505] rounded-3xl overflow-hidden">
      {/* Left side text content */}
      <div className="relative flex flex-col items-start px-4 md:px-12 w-full md:w-1/2 pb-[30vh]">
        {content.map((item, index) => (
          <div 
            key={item.title + index} 
            className="sticky-text-block min-h-[80vh] flex flex-col justify-center max-w-2xl w-full"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-4xl md:text-6xl font-heading font-bold mb-6 transition-colors duration-500 ${activeCard === index ? "text-white" : "text-white/20"}`}
            >
              {item.title}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`text-lg md:text-xl leading-relaxed max-w-sm transition-all duration-500 ${activeCard === index ? "text-white/80" : "text-white/10"}`}
            >
              {item.description}
            </motion.div>
          </div>
        ))}
      </div>
      
      {/* Right side image that sticks */}
      <div className="hidden md:flex w-1/2 h-screen sticky top-0 items-center justify-center p-8">
        <div
          className={cn(
            "h-[80vh] w-full rounded-3xl bg-white overflow-hidden shadow-2xl relative transition-all duration-700 ease-in-out",
            contentClassName
          )}
        >
          {content.map((item, index) => (
            <div 
              key={index} 
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${activeCard === index ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
