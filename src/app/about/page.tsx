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

      {/* ── Contact Section ── */}
      <section id="contact" className="w-full py-32 md:py-48 px-6 md:px-12 lg:px-20 bg-[var(--card)] border-t border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto text-center flex flex-col items-center">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-px bg-[var(--brand-deep-rose)]" />
            <span className="font-ui font-bold text-[10px] tracking-[0.35em] uppercase text-[var(--brand-deep-rose)]">
              Get in Touch
            </span>
            <div className="w-10 h-px bg-[var(--brand-deep-rose)]" />
          </div>
          <h2 className="font-display font-bold text-5xl md:text-7xl text-[var(--foreground)] mb-6">
            We'd love to <span className="italic font-normal text-[var(--brand-champagne)]">hear from you.</span>
          </h2>
          <p className="font-editorial text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto mb-12">
            Whether you have a question about our custom cakes, need assistance with an order, or just want to say hello, we're here for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-md mx-auto">
            {/* WhatsApp Button */}
            <a 
              href="https://wa.me/919909011111" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full sm:w-1/2 py-4 px-6 rounded-full border border-[#25D366]/30 bg-[#25D366]/5 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 hover:shadow-[0_8px_24px_rgba(37,211,102,0.3)]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-ui font-semibold text-sm uppercase tracking-wider">WhatsApp</span>
            </a>

            {/* Instagram Button */}
            <a 
              href="https://instagram.com/gopalcakes" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-3 w-full sm:w-1/2 py-4 px-6 rounded-full border border-[var(--brand-deep-rose)]/30 bg-[var(--brand-deep-rose)]/5 text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)] hover:text-white transition-all duration-300 hover:shadow-[0_8px_24px_rgba(160,48,96,0.3)]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="font-ui font-semibold text-sm uppercase tracking-wider">Instagram</span>
            </a>
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
