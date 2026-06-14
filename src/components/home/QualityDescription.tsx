"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

const description = "Since 1995, we haven't just baked cakes. We've crafted memories using pure Belgian chocolate and uncompromising passion.";

export function QualityDescription() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 40%"] 
  });

  const words = description.split(" ");

  // Slight parallax for the image on the right
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <section ref={containerRef} className="py-20 md:py-24 bg-background px-4 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left Side: Short, left-aligned disappearing text effect */}
        <div className="flex flex-col justify-center">
          <p className="text-primary font-medium tracking-widest uppercase text-xs mb-6">Our Legacy</p>
          <h2 className="sr-only">Quality Promise</h2>
          <p className="font-heading text-2xl md:text-3xl lg:text-4xl font-medium leading-relaxed text-foreground flex flex-wrap justify-start gap-x-2 gap-y-1">
            {words.map((word, i) => {
              const start = i / words.length;
              const end = start + (1 / words.length);
              
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const opacity = useTransform(scrollYProgress, [start, end], [0.1, 1]);
              
              return (
                <motion.span key={i} style={{ opacity }} className="inline-block">
                  {word}
                </motion.span>
              );
            })}
          </p>
        </div>

        {/* Right Side: Owner/Baker Image with parallax and edgeless mask */}
        <div className="relative h-[400px] md:h-[500px] w-full hidden md:block" style={{ maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)" }}>
          <motion.div style={{ y: imageY }} className="absolute inset-[-10%] w-[120%] h-[120%]">
            <Image 
              src="https://images.unsplash.com/photo-1556217477-d325251ece38?q=80&w=1000&auto=format&fit=crop"
              alt="Master Baker at Gopal Cake Shop"
              fill
              className="object-cover opacity-80"
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
