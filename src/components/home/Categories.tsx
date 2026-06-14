"use client";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";

const categories = [
  { 
    name: "Wedding Cakes", 
    description: "Multi-tiered masterpieces crafted with pure Belgian chocolate.",
    image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800&auto=format&fit=crop", 
    slug: "wedding",
    className: "md:col-span-2 md:row-span-2"
  },
  { 
    name: "Birthday Specials", 
    description: "Celebrate another year with our signature creations.",
    image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=500&auto=format&fit=crop", 
    slug: "birthday",
    className: "md:col-span-1 md:row-span-1"
  },
  { 
    name: "Custom Photo Cakes", 
    description: "Edible memories printed in high definition.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop", 
    slug: "custom",
    className: "md:col-span-1 md:row-span-1"
  },
  { 
    name: "Premium Pastries", 
    description: "Bite-sized luxury for your daily cravings.",
    image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=800&auto=format&fit=crop", 
    slug: "pastries",
    className: "md:col-span-2 md:row-span-1"
  },
  { 
    name: "Artisan Breads", 
    description: "Freshly baked sourdough and baguettes.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop", 
    slug: "breads",
    className: "md:col-span-1 md:row-span-1"
  },
];

const SkeletonImage = ({ src }: { src: string }) => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden relative" data-cursor="hover">
    <Image src={src} alt="Category" fill className="object-cover transition-transform duration-700 hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
  </div>
);

export function Categories() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -50]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -150]);

  return (
    <section ref={containerRef} className="py-32 bg-[#050505] relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-heading text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
          >
            The Collection
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white/60 max-w-2xl mx-auto text-lg md:text-xl font-light"
          >
            Explore our gallery of handcrafted delicacies, perfected for every occasion.
          </motion.p>
        </div>
        
        <BentoGrid className="max-w-6xl mx-auto auto-rows-[20rem] md:auto-rows-[22rem]">
          {categories.map((category, i) => (
            <motion.div
              key={i}
              className={category.className}
              style={{ y: i % 3 === 0 ? y1 : i % 2 === 0 ? y2 : y3 }}
            >
              <Link href={`/category/${category.slug}`} className="block h-full w-full">
                <BentoGridItem
                  title={<span className="text-white text-2xl md:text-3xl drop-shadow-md font-heading">{category.name}</span>}
                  description={<span className="text-white/70 line-clamp-2 text-sm">{category.description}</span>}
                  header={<SkeletonImage src={category.image} />}
                  className="h-full border-white/5 hover:border-white/20 transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] bg-white/5 backdrop-blur-sm"
                />
              </Link>
            </motion.div>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}
