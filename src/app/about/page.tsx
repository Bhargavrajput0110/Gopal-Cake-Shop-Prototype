"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown2 } from "iconsax-react";
import Link from "next/link";
import { useRef } from "react";
import { BackButton } from "@/components/ui/BackButton";

const TIMELINE = [
  {
    year: "1995",
    title: "The Beginning",
    desc: "Started as a small bakery in Vadodara with a single oven and a passion for crafting the perfect eggless sponge."
  },
  {
    year: "2002",
    title: "Signature Recipe",
    desc: "Perfected our now-famous Belgian Chocolate Truffle, which remains our bestselling cake to this day."
  },
  {
    year: "2010",
    title: "Expansion",
    desc: "Opened our flagship store in Alkapuri, bringing our artisanal creations to the heart of the city."
  },
  {
    year: "2023",
    title: "Modern Era",
    desc: "Launched our custom design studio, pushing the boundaries of what's possible in eggless baking."
  }
];

export default function AboutPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
      
      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative w-full min-h-[90vh] flex flex-col justify-end pb-24 px-6 md:px-12 lg:px-20 pt-[148px] overflow-hidden">
        {/* Background Image Parallax */}
        <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1556910103-1c02745a8647?q=80&w=2000&auto=format&fit=crop"
            alt="Bakery background"
            fill
            className="object-cover sepia-[0.15] scale-105"
            priority
          />
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-[var(--background)]/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-transparent to-transparent" />
        </motion.div>
        
        <div className="relative z-10 max-w-[1440px] mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <BackButton fallback="/" label="Back to Home" variant="link" className="px-0 mb-8 text-[var(--brand-champagne)] hover:text-white uppercase tracking-widest text-[10px] font-bold" />
            
            <div className="flex items-center gap-3 mb-6">
              <span className="block w-10 h-px bg-[var(--brand-champagne)]" />
              <span className="font-ui font-bold text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] block">
                Since 1995
              </span>
            </div>

            <h1 className="font-display text-6xl md:text-8xl lg:text-[10vw] font-bold leading-[0.85] tracking-tighter text-[var(--foreground)] mb-12">
              Our
              <span className="block italic font-normal text-[var(--brand-deep-rose)]">Legacy.</span>
            </h1>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-[var(--border)] pt-8">
              <p className="font-editorial text-lg md:text-xl text-[var(--muted-foreground)] max-w-xl leading-relaxed">
                For over three decades, we have been crafting edible masterpieces for Vadodara's most cherished celebrations. Always fresh, always 100% eggless.
              </p>
              
              <div className="w-14 h-14 rounded-full border border-[var(--border)] flex items-center justify-center animate-bounce shrink-0">
                <ArrowDown2 className="w-5 h-5 text-[var(--brand-champagne)]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Philosophy Section ── */}
      <section className="w-full bg-[var(--brand-chocolate)] text-white py-32 md:py-48 px-6 md:px-12 lg:px-20 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
          style={{ background: "rgba(200,169,126,0.05)" }} />

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
                The Philosophy
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <h2 className="font-display font-bold text-5xl md:text-7xl leading-[1.05] mb-12">
              The Secret <br/>
              Ingredient is <span className="italic font-normal text-[var(--brand-champagne)]">Obsession.</span>
            </h2>

            <div className="space-y-8 max-w-lg">
              <p className="font-editorial text-lg text-white/60 leading-relaxed">
                We refuse to compromise. From sourcing authentic Madagascar vanilla beans to using only premium Belgian chocolate, every ingredient that enters our kitchen is heavily vetted.
              </p>
              <p className="font-editorial text-lg text-white/60 leading-relaxed">
                Our kitchens operate round the clock. We don't believe in freezing sponges. Every single cake is baked fresh on the day of delivery, ensuring maximum moisture, flavor, and that melt-in-your-mouth texture our customers expect.
              </p>
            </div>
            
            <div className="mt-12">
              <Link href="/menu">
                <button className="btn-secondary px-8 py-4 text-[11px] border-white/20 text-white hover:border-[var(--brand-champagne)] hover:text-[var(--brand-champagne)]">
                  Taste the Difference
                </button>
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-white/5"
          >
            <Image 
              src="https://images.unsplash.com/photo-1557925923-33b251dc3296?q=80&w=1000&auto=format&fit=crop"
              alt="Chef working"
              fill
              className="object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
            />
            {/* Inner shadow */}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Timeline Section ── */}
      <section className="w-full py-32 md:py-48 px-6 md:px-12 lg:px-20 bg-[var(--background)]">
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-24 text-center flex flex-col items-center">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-[var(--brand-deep-rose)]" />
              <span className="font-ui font-bold text-[10px] tracking-[0.35em] uppercase text-[var(--brand-deep-rose)]">
                Our Journey
              </span>
              <div className="w-10 h-px bg-[var(--brand-deep-rose)]" />
            </div>
            <h2 className="font-display font-bold text-5xl md:text-7xl text-[var(--foreground)]">
              Three Decades of
              <span className="block font-display italic font-normal text-[var(--brand-champagne)]">
                Sweetness
              </span>
            </h2>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Center Line */}
            <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-px bg-[var(--border)] md:-translate-x-1/2" />

            <div className="space-y-16 md:space-y-32">
              {TIMELINE.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <motion.div 
                    key={item.year}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative flex flex-col md:flex-row items-start md:items-center ${isEven ? 'md:flex-row-reverse' : ''}`}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-[27px] md:left-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-4 border-[var(--brand-champagne)] md:-translate-x-1/2 mt-1.5 md:mt-0 z-10" />
                    
                    {/* Content */}
                    <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'md:pr-20 md:text-right' : 'md:pl-20 md:text-left'}`}>
                      <span className="font-display italic text-4xl md:text-5xl text-[var(--brand-champagne)] mb-4 block">
                        {item.year}
                      </span>
                      <h3 className="font-display font-bold text-2xl md:text-3xl text-[var(--foreground)] mb-3">
                        {item.title}
                      </h3>
                      <p className="font-editorial text-[var(--muted-foreground)] text-base md:text-lg leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="relative py-32 md:py-48 px-6 md:px-12 text-center bg-[var(--muted)] border-t border-[var(--border)] overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.03] -z-10 blur-3xl"
          style={{ background: "var(--brand-deep-rose)" }} />
        
        <div className="max-w-2xl mx-auto relative z-10">
          <h2 className="font-display font-bold text-4xl md:text-6xl text-[var(--foreground)] mb-6">
            Ready to taste the <span className="italic font-normal text-[var(--brand-deep-rose)]">magic?</span>
          </h2>
          <p className="font-editorial text-[var(--muted-foreground)] text-lg mb-10">
            Order online for same-day delivery, or visit one of our branches in Vadodara to experience the aroma of fresh baking.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/menu">
              <button className="btn-primary px-8 py-4 text-[11px] w-full sm:w-auto">
                Order Now
              </button>
            </Link>
            <Link href="/about#contact">
              <button className="btn-secondary px-8 py-4 text-[11px] w-full sm:w-auto">
                Find a Store
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
