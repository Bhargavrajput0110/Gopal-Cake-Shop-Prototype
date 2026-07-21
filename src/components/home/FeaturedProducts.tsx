"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight2 } from "iconsax-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QuickBuyForm } from "@/components/menu/QuickBuyForm";

const SKELETON_COUNT = 8;

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full aspect-[3/4] rounded-3xl skeleton" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-5 w-3/4 rounded-full skeleton" />
        <div className="h-4 w-1/2 rounded-full skeleton" />
      </div>
    </div>
  );
}

function FeaturedProductCard({ product, idx }: { product: any, idx: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const ratios = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-square"];
  const aspectClass = ratios[idx % ratios.length];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.7,
          delay: (idx % 4) * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="group flex flex-col break-inside-avoid relative"
      >
        {/* Image Container */}
        <div
          onClick={() => setIsOpen(true)}
          className={`relative w-full ${aspectClass} rounded-[2rem] overflow-hidden bg-[var(--muted)] mb-4 block cursor-pointer`}
          style={{ willChange: "transform" }}
        >
          {/* Image / Placeholder */}
          {product.thumbnail ? (
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--muted)]">
              <span className="font-editorial italic text-[var(--muted-foreground)] text-sm">
                Arriving Soon
              </span>
            </div>
          )}

          {/* Dark hover overlay */}
          <div className="absolute inset-0 bg-[var(--brand-chocolate)]/0 group-hover:bg-[var(--brand-chocolate)]/30 transition-colors duration-500" />

          {/* Tag */}
          <div className="absolute top-4 left-4 badge-glass text-[var(--brand-deep-rose)] flex items-center gap-1">
            <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 0l1.5 4.5H12l-3.7 2.7 1.4 4.5L6 9.3 2.3 11.7l1.4-4.5L0 4.5h4.5z"/>
            </svg>
            <span>Signature</span>
          </div>

          {/* Floating Quick Action */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-deep-rose)] text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>

          {/* Hover text overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] p-5 pb-6">
             <span className="font-ui text-[11px] font-bold tracking-[0.1em] uppercase text-white/90">
               Quick Order
             </span>
          </div>

          {/* Inner shadow to soften edges */}
          <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem] pointer-events-none" />
        </div>

        {/* Text info */}
        <div
          onClick={() => setIsOpen(true)}
          className="flex flex-col px-2 cursor-pointer"
        >
          <h3 className="font-display font-bold text-base md:text-lg text-[var(--foreground)] group-hover:text-[var(--brand-deep-rose)] transition-colors duration-300 leading-snug line-clamp-1">
            {product.name}
          </h3>
          <p className="font-ui text-[12px] font-semibold text-[var(--brand-champagne)] mt-1 tracking-wide">
            Starts at ₹{product.basePrice}
          </p>
        </div>
      </motion.div>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-background z-[150] border-l-0 shadow-2xl">
        <QuickBuyForm 
          product={product} 
          isCustom={product.isCustom || product.name.toLowerCase().includes('custom')}
          isPhotoCake={product.name.toLowerCase().includes('photo') || (product.category?.name || "").toLowerCase().includes('photo')}
          onClose={() => setIsOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
}

export function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/public/products")
      .then(async (res) => {
        if (!res.ok) throw new Error("API Route Failed");
        return res.json();
      })
      .then((data) => {
        const fetched = Array.isArray(data) ? data : data.data || [];
        setProducts(fetched.slice(0, 8));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-28 md:py-36 bg-[var(--background)] overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] -z-10 blur-3xl"
        style={{ background: "var(--brand-deep-rose)" }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04] -z-10 blur-3xl"
        style={{ background: "var(--brand-champagne)" }} />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
        {/* ── Editorial Header ── */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-lg">
            {/* Eyebrow */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-px bg-[var(--brand-champagne)]" />
              <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
                Our Bestsellers
              </span>
            </div>
            <h2 className="font-display font-bold text-[var(--foreground)] leading-[0.92]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}>
              Signature
              <span className="block font-display italic font-normal text-[var(--brand-deep-rose)]">
                Bakes
              </span>
            </h2>
            <p className="font-editorial text-[var(--muted-foreground)] text-lg mt-4 leading-relaxed max-w-sm">
              Freshly crafted every morning, with love and the finest ingredients.
            </p>
          </div>

          <Link
            href="/menu"
            className="group flex items-center gap-3 text-[var(--foreground)]/60 hover:text-[var(--brand-deep-rose)] transition-all duration-300 self-start md:self-auto"
          >
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.2em]">
              View Full Menu
            </span>
            <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center group-hover:bg-[var(--brand-deep-rose)] group-hover:border-[var(--brand-deep-rose)] group-hover:text-white transition-all duration-300">
              <ArrowRight2 className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

        {/* ── Product Grid ── */}
        {/* ── Product Masonry ── */}
        {loading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
            {products.map((product, idx) => {
              return (
                <FeaturedProductCard key={product.id} product={product} idx={idx} />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
