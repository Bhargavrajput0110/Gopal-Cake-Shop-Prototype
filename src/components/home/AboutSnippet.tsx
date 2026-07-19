"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function AboutSnippet() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Parallax for the image
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section ref={containerRef} className="w-full bg-background py-24 md:py-32 overflow-hidden relative z-20 border-t border-border/40">

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Aesthetic Image Column */}
          <div className="lg:col-span-5 h-[60vh] md:h-[80vh] relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-border shadow-[0_15px_40px_-15px_rgba(246,201,214,0.3)]">
            <motion.div 
              className="absolute inset-0 w-full h-[120%]"
              style={{ y: imageY }}
            >
              <Image 
                src="https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=1200&auto=format&fit=crop"
                alt="Our Bakery Story"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover sepia-[0.1]"
              />
            </motion.div>
          </div>

          {/* Typography Column */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="font-sans font-bold text-[10px] tracking-[0.4em] uppercase text-secondary block mb-6">
              The Genesis
            </span>
            
            <h2 className="font-serif text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-10">
              A Tradition of <br />
              <span className="italic font-light text-secondary">Excellence.</span>
            </h2>

            <div className="space-y-6 max-w-xl">
              <p className="font-serif text-base md:text-lg text-foreground/80 leading-relaxed italic">
                [Client will provide content here. This is a placeholder for the first paragraph detailing the origin of the bakery, the founding year, and the initial vision.]
              </p>
              
              <p className="font-serif text-base md:text-lg text-foreground/80 leading-relaxed italic">
                [Client will provide content here. This is a placeholder for the second paragraph detailing the commitment to quality, the sourcing of premium ingredients, and the dedication to the craft of baking.]
              </p>
              
              <p className="font-serif text-base md:text-lg text-foreground/80 leading-relaxed italic">
                [Client will provide content here. This is a placeholder for the final concluding thought, perhaps focusing on the community, the joy of celebrations, and the future of the brand.]
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-border max-w-xl flex items-center justify-between">
              <div>
                <p className="font-serif font-bold text-3xl text-foreground">Gopal Family</p>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-foreground/60 mt-2 font-bold">Founders & Master Bakers</p>
              </div>
              <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center bg-muted">
                <span className="font-serif text-2xl text-secondary italic font-bold">G</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
