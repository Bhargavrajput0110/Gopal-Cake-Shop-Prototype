"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight2 } from "iconsax-react";

const CATEGORIES = [
  {
    id: "01",
    name: "Wedding",
    note: "Multi-tiered masterpieces for your perfect day.",
    image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=900&auto=format&fit=crop",
    slug: "wedding",
    tag: "Bestseller",
    size: "large", // spans 2 rows on desktop
  },
  {
    id: "02",
    name: "Birthday",
    note: "Fresh berries & vanilla glaze.",
    image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=700&auto=format&fit=crop",
    slug: "birthday",
    tag: "Most Popular",
    size: "normal",
  },
  {
    id: "03",
    name: "Custom",
    note: "Your imagination, our artistry.",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&auto=format&fit=crop",
    slug: "custom",
    tag: "Bespoke",
    size: "normal",
  },
  {
    id: "04",
    name: "Pastries",
    note: "Delicate daily laminations.",
    image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=900&auto=format&fit=crop",
    slug: "pastries",
    tag: "New",
    size: "normal",
  },
  {
    id: "05",
    name: "Bento Cakes",
    note: "Miniature art, maximum delight.",
    image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=700&auto=format&fit=crop",
    slug: "bento",
    tag: "Trending",
    size: "normal",
  },
];

export function Categories() {
  return (
    <section className="py-28 md:py-36 bg-[var(--background)] overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">

        {/* ── Editorial Header ── */}
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-px bg-[var(--brand-deep-rose)]" />
              <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-deep-rose)] font-semibold">
                The Collections
              </span>
            </div>
            <h2 className="font-display font-bold text-[var(--foreground)] leading-[0.92]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 5.5rem)" }}>
              Every
              <span className="block font-display italic font-normal text-[var(--brand-champagne)]">
                Occasion
              </span>
            </h2>
          </div>

          <Link
            href="/menu"
            className="group flex items-center gap-3 text-[var(--foreground)]/50 hover:text-[var(--brand-deep-rose)] transition-all duration-300 self-start md:self-auto"
          >
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.2em]">
              Explore All
            </span>
            <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center group-hover:bg-[var(--brand-deep-rose)] group-hover:border-[var(--brand-deep-rose)] group-hover:text-white transition-all duration-300">
              <ArrowRight2 className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>

        {/* ── Asymmetric Layout ── */}
        {/* Desktop: Large card left (Wedding), 2x2 grid right */}
        {/* Mobile: Single column */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr] lg:grid-rows-2 gap-5 lg:h-[780px]">

          {/* Wedding — Large card, full height left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:row-span-2"
          >
            <Link
              href={`/menu?category=${CATEGORIES[0].slug}`}
              className="relative group flex flex-col h-full min-h-[380px] lg:min-h-full rounded-3xl overflow-hidden bg-[var(--muted)] block"
            >
              <Image
                src={CATEGORIES[0].image}
                alt={CATEGORIES[0].name}
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-chocolate)]/80 via-[var(--brand-chocolate)]/20 to-transparent" />

              {/* Tag */}
              <div className="absolute top-6 left-6 badge-glass text-[var(--brand-champagne)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-champagne)] animate-pulse" />
                {CATEGORIES[0].tag}
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
                <span className="font-ui text-[9px] tracking-[0.35em] uppercase text-white/60 font-semibold block mb-3">
                  {CATEGORIES[0].id}
                </span>
                <h3 className="font-display font-bold text-white leading-none mb-3"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}>
                  {CATEGORIES[0].name}
                </h3>
                <p className="font-editorial italic text-white/70 text-lg">
                  {CATEGORIES[0].note}
                </p>

                {/* Hover arrow */}
                <div className="mt-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--brand-champagne)]">
                    Explore
                  </span>
                  <ArrowRight2 className="w-4 h-4 text-[var(--brand-champagne)]" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Right: 2x2 grid of remaining categories */}
          <div className="grid grid-cols-2 gap-4 md:gap-5 lg:contents">
            {CATEGORIES.slice(1).map((cat, idx) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="col-span-1"
              >
                <Link
                  href={`/menu?category=${cat.slug}`}
                  className="relative group flex h-full min-h-[200px] lg:min-h-[370px] rounded-[2rem] overflow-hidden bg-[var(--muted)] block"
                >
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-[var(--brand-chocolate)]/0 group-hover:bg-[var(--brand-chocolate)]/20 transition-colors duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-chocolate)]/80 via-[var(--brand-chocolate)]/20 to-transparent" />

                  {/* Tag */}
                  {cat.tag && (
                    <div className="absolute top-4 left-4 badge-glass text-[var(--brand-champagne)] text-[9px]">
                      {cat.tag}
                    </div>
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 z-10">
                    <h3 className="font-display font-bold text-white text-xl md:text-2xl leading-tight mb-1 group-hover:text-[var(--brand-champagne)] transition-colors duration-300">
                      {cat.name}
                    </h3>
                    <p className="font-editorial italic text-white/60 text-xs md:text-sm line-clamp-1">
                      {cat.note}
                    </p>
                  </div>

                  {/* Hover: scale border */}
                  <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-black/5 group-hover:ring-[var(--brand-champagne)]/40 transition-all duration-400 pointer-events-none" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
