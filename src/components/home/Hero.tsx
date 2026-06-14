"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { HeroDeliveryChecker } from "./HeroDeliveryChecker";
import { BorderBeam } from "@/components/magicui/BorderBeam";

function Letter({ letter, i, scrollYProgress }: { letter: string, i: number, scrollYProgress: MotionValue<number> }) {
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, 45 + (i * 10)]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [0, (i % 2 === 0 ? 15 : -15)]);
  const yOffset = useTransform(scrollYProgress, [0, 1], ["0%", `${-20 - (i * 15)}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <motion.span
      style={{ 
        rotateX, 
        rotateY, 
        y: yOffset,
        opacity,
        display: "inline-block", 
        transformStyle: "preserve-3d" 
      }}
      initial={{ opacity: 0, rotateX: 90, y: 100 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 + (i * 0.05) }}
    >
      {letter === " " ? "\u00A0" : letter}
    </motion.span>
  );
}

function AnimatedLetters({ text, scrollYProgress }: { text: string, scrollYProgress: MotionValue<number> }) {
  const letters = text.split("");
  return (
    <div className="flex justify-center flex-wrap">
      {letters.map((letter, i) => (
        <Letter key={i} letter={letter} i={i} scrollYProgress={scrollYProgress} />
      ))}
    </div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [0.8, 0.1]);

  const cakeY = useTransform(scrollYProgress, [0, 1], ["0%", "-120%"]);
  const cakeRotateX = useTransform(scrollYProgress, [0, 1], [0, -35]);
  const cakeRotateY = useTransform(scrollYProgress, [0, 1], [0, 25]);
  const cakeScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <section ref={containerRef} className="relative min-h-screen w-full bg-[#050505] overflow-hidden" style={{ perspective: "1500px" }}>
      
      {/* SVG Liquid Filter Definition */}
      <svg className="hidden">
        <filter id="liquid">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale={isHovered ? 30 : 0} 
            xChannelSelector="R" 
            yChannelSelector="G" 
            style={{ transition: "scale 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </filter>
      </svg>

      <motion.div 
        style={{ y: bgY, opacity: bgOpacity }}
        className="absolute inset-0 w-full h-full will-change-transform z-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full scale-105"
        >
          <source src="https://cdn.pixabay.com/video/2016/09/21/5412-183786483_large.mp4" type="video/mp4" />
        </video>
        {/* Extreme dark gradient to make the video moody and text readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/80" />
        <div className="absolute inset-0 bg-black/30" />
      </motion.div>

      <div className="relative z-10 min-h-[100dvh] w-full flex flex-col md:flex-row items-center justify-center px-4 md:px-12 lg:px-24 py-32 md:py-0">
        
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left z-20 perspective-[1000px]">
          <motion.p
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-[#D4AF37] text-sm tracking-[0.4em] uppercase font-bold mb-6 flex items-center gap-4 drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]"
          >
            <span className="w-8 md:w-12 h-[1px] bg-[#D4AF37] hidden md:block"></span>
            The Art of Baking
          </motion.p>

          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[7rem] xl:text-[8rem] text-white font-bold tracking-tight leading-[0.9] mb-8 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            <AnimatedLetters text="GOPAL" scrollYProgress={scrollYProgress} />
            <div className="text-[#D4AF37] italic font-light mt-2 drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              <AnimatedLetters text="CAKES" scrollYProgress={scrollYProgress} />
            </div>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-col gap-6 w-full items-center md:items-start mt-4"
          >
            <Link href="/menu" className="group relative">
              <div className="relative h-16 px-14 flex items-center justify-center font-black text-sm tracking-[0.3em] text-white bg-black/40 backdrop-blur-md rounded-full overflow-hidden transition-all duration-500 hover:bg-[#D4AF37]/10 hover:shadow-[0_0_40px_rgba(212,175,55,0.5)]">
                <BorderBeam size={80} duration={8} colorFrom="#D4AF37" colorTo="#ff0000" />
                <span className="relative z-10 group-hover:scale-105 transition-transform duration-500">EXPLORE MENU</span>
              </div>
            </Link>

            {/* Global Delivery Checker Injection */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.5 }}
              className="w-full max-w-lg mt-4"
            >
              <HeroDeliveryChecker />
            </motion.div>
          </motion.div>
        </div>

        {/* Liquid Hover Cake Image */}
        <div className="w-full md:w-1/2 h-full flex items-center justify-center relative mt-24 md:mt-0 z-10 hidden md:flex">
          <motion.div
            style={{ y: cakeY, rotateX: cakeRotateX, rotateY: cakeRotateY, scale: cakeScale }}
            initial={{ opacity: 0, z: -500, rotateY: 90 }}
            animate={{ opacity: 1, z: 0, rotateY: -10 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
            className="relative w-[80%] max-w-[450px] aspect-[4/5] shadow-[0_40px_80px_rgba(212,175,55,0.2)] border border-white/5 rounded-2xl will-change-transform cursor-crosshair overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="w-full h-full overflow-hidden" style={{ filter: "url(#liquid)" }}>
              <Image
                src="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=1000&auto=format&fit=crop"
                alt="Premium Strawberry Chocolate Cake"
                fill
                className="object-cover transition-transform duration-1000 hover:scale-[1.15]"
                priority
              />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
