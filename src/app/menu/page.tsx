"use client";

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ArrowRight2, SearchNormal1 } from "iconsax-react";
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { BackButton } from "@/components/ui/BackButton";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Hardcoded frontend taxonomy until backend is updated
const CATEGORY_GROUPS = [
  {
    title: "By Recipient",
    items: ["Mom Cake", "Women's Cake", "Dad Cake", "Men's Cake", "Boys Cake", "Girls Cake", "Wife Cake", "Boss Baby Cake"]
  },
  {
    title: "Occasions & Events",
    items: ["Wedding", "Baby Shower Cake", "Welcome Baby Cake", "1st Birthday Cake", "5th Birthday Cake", "13th Birthday Cake", "Anniversary Cake", "25th Anniversary Cake", "50th Anniversary Cake", "Engagement Cake", "Graduation Cake", "Corporate Cake"]
  },
  {
    title: "Bento & Mini",
    items: ["Bento Cake for Men", "Bento Cake for Women", "Bento Anniversary Cake", "Bento Couple Cake", "Bento Love Theme Cake"]
  },
  {
    title: "Pop Culture & Characters",
    items: ["Batman Cake", "Spider-Man Cake", "Avengers Cake", "Super Mario Cake", "Mickey Mouse Cake", "Harry Potter Cake", "Cocomelon Cake", "Lightning McQueen Cake", "Hot Wheels Cake", "JCB Cake", "Dinosaur Cake", "Astronaut Cake", "Jungle Cake", "K-Pop Demon Hunters Cake", "Unicorn Cake", "Teddy Cake"]
  },
  {
    title: "Styles & Themes",
    items: ["Fresh Flower Cake", "Rice Paper Cake", "Isomalt Cake", "King Cake", "Rainbow Cake", "Pinata Cake", "Bow Cake", "Top Forward Cake", "Levitating Cake", "Vintage Photo Cake", "Alcohol Bottle Theme Cake", "Evil Eye Cake"]
  },
  {
    title: "Hobbies & Professions",
    items: ["Cricket Cake", "Football Cake", "Doctor Cake", "Bike Cake", "Car Cake", "Army Cake"]
  }
];

function ProductCard({ product, idx }: { product: any, idx: number }) {
  const { addItem } = useCart();
  
  // Vary aspect ratios for true masonry look
  const ratios = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-square"];
  const aspectClass = ratios[idx % ratios.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: (idx % 12) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group flex flex-col"
    >
      {/* Image Container */}
      <Link 
        href={`/custom?slug=${product.slug || product.id}&image=${encodeURIComponent(product.thumbnail || "")}`}
        className={`relative w-full ${aspectClass} rounded-[2rem] overflow-hidden bg-[var(--muted)] mb-4 block`}
        style={{ willChange: "transform" }}
      >
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
              Image Coming Soon
            </span>
          </div>
        )}

        {/* Dark hover overlay */}
        <div className="absolute inset-0 bg-[var(--brand-chocolate)]/0 group-hover:bg-[var(--brand-chocolate)]/30 transition-colors duration-500" />
        
        {/* Floating Quick Action (Pinterest style Save/View) */}
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
             View Details
           </span>
        </div>

        {/* Inner shadow to soften edges */}
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem] pointer-events-none" />
      </Link>

      {/* Info */}
      <Link href={`/custom?slug=${product.slug || product.id}&image=${encodeURIComponent(product.thumbnail || "")}`} className="flex flex-col px-1">
        <h3 className="font-display font-bold text-base md:text-lg text-[var(--foreground)] group-hover:text-[var(--brand-deep-rose)] transition-colors duration-300 leading-snug line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1.5">
          <p className="font-ui text-[12px] font-semibold text-[var(--brand-champagne)] tracking-wide">
            From ₹{product.basePrice}
          </p>
          {product.category?.name && (
            <p className="font-editorial italic text-[var(--muted-foreground)] text-xs line-clamp-1 max-w-[50%] text-right">
              {product.category.name}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function MenuPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Initialize state from URL
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', page.toString());
    
    const currentQueryString = searchParams.toString();
    const newQueryString = params.toString();
    
    if (currentQueryString !== newQueryString && !isInitialMount) {
      router.replace(`${pathname}?${newQueryString}`, { scroll: false });
    }
  }, [activeCategory, debouncedSearch, sort, page, pathname, router, searchParams, isInitialMount]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    setPage(1);
  }, [activeCategory, debouncedSearch, sort]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.append('category', activeCategory);
    if (debouncedSearch) params.append('search', debouncedSearch);
    params.append('sort', sort);
    params.append('page', page.toString());
    params.append('limit', '20'); // Use 20 for proper pagination demo

    fetch(`/api/v1/public/products?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("API Route Failed");
        return res.json();
      })
      .then((data) => {
        const fetchedProducts = Array.isArray(data) ? data : data.data || [];
        setProducts(fetchedProducts);
        if (data.meta) setTotalPages(data.meta.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [activeCategory, debouncedSearch, sort, page]);

  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-background text-foreground pt-[90px] md:pt-[116px] pb-32">
      <div className="max-w-[1500px] mx-auto px-6 md:px-12 lg:px-16 mb-4">
        <BackButton fallback="/" label="Back to Home" variant="ghost" />
      </div>
      {/* ── Editorial Hero ── */}
      <section className="relative w-full h-[40vh] min-h-[300px] flex flex-col justify-center items-center text-center px-4 mb-16 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-[0.06] -z-10 blur-3xl pointer-events-none"
          style={{ background: "var(--brand-champagne)" }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="block w-8 h-px bg-[var(--brand-champagne)]" />
          <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[var(--brand-champagne)] font-semibold">
            Bespoke Collection
          </span>
          <span className="block w-8 h-px bg-[var(--brand-champagne)]" />
        </motion.div>

        <div className="overflow-hidden mb-6">
          <motion.h1 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-[var(--foreground)] leading-[0.9] tracking-tight"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
          >
            The
            <span className="font-display italic font-normal text-[var(--brand-deep-rose)] ml-3">
              Catalogue
            </span>
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-editorial text-[var(--muted-foreground)] text-base md:text-lg max-w-lg leading-relaxed"
        >
          Explore our curated selection of artisanal bakes across 60+ bespoke categories. Handcrafted daily in Vadodara.
        </motion.p>
      </section>

      {/* ── Main Layout ── */}
      <div className="max-w-[1500px] mx-auto px-6 md:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 lg:gap-16">
        
        {/* Left Sidebar Taxonomy (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-[130px] max-h-[calc(100vh-160px)] overflow-y-auto pr-6 custom-scrollbar pb-12">
            
            {/* Search */}
            <div className="relative mb-10">
              <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <input 
                type="text" 
                placeholder="Search flavours, themes..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--muted)] border border-[var(--border)] text-sm font-ui rounded-full pl-11 pr-5 py-3 focus:outline-none focus:border-[var(--brand-champagne)]/50 focus:bg-transparent transition-all placeholder:text-[var(--muted-foreground)]/60"
              />
            </div>

            <div className="mb-10">
              <button 
                onClick={() => setActiveCategory('All')}
                className={`w-full text-left flex items-center justify-between py-2 group transition-all duration-300 ${activeCategory === 'All' ? 'text-[var(--brand-deep-rose)]' : 'text-foreground/70 hover:text-foreground'}`}
              >
                <span className="font-ui text-[11px] font-bold uppercase tracking-[0.15em]">
                  View Everything
                </span>
                {activeCategory === 'All' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-deep-rose)]" />}
              </button>
            </div>

            <div className="space-y-10">
              {CATEGORY_GROUPS.map(group => (
                <div key={group.title}>
                  <h3 className="font-ui text-[10px] tracking-[0.25em] uppercase text-[var(--brand-champagne)] font-semibold mb-5 flex items-center gap-3">
                    <span className="w-3 h-px bg-[var(--brand-champagne)]/50" />
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map(item => (
                      <li key={item}>
                        <button
                          onClick={() => setActiveCategory(item)}
                          className={`w-full text-left py-1.5 font-editorial text-sm md:text-base transition-colors duration-300 ${
                            activeCategory === item 
                              ? "text-[var(--brand-deep-rose)] italic" 
                              : "text-foreground/60 hover:text-[var(--brand-champagne)]"
                          }`}
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Filters / Search */}
        <div className="lg:hidden flex flex-col gap-5">
          <div className="relative">
            <SearchNormal1 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Search catalogue..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--muted)] border border-[var(--border)] text-sm font-ui rounded-full pl-11 pr-5 py-3.5 focus:outline-none focus:border-[var(--brand-champagne)]/50 transition-all"
            />
          </div>

          <div className="flex overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar gap-2">
            <button 
              onClick={() => setActiveCategory('All')}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${
                activeCategory === 'All' 
                  ? 'bg-[var(--brand-deep-rose)] border-[var(--brand-deep-rose)] text-white' 
                  : 'bg-transparent border-[var(--border)] text-foreground/60'
              }`}
            >
              All
            </button>
            {CATEGORY_GROUPS.flatMap(g => g.items).slice(0, 15).map(item => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full font-ui text-[11px] font-bold uppercase tracking-[0.1em] transition-all border ${
                  activeCategory === item 
                    ? 'bg-[var(--brand-deep-rose)] border-[var(--brand-deep-rose)] text-white' 
                    : 'bg-transparent border-[var(--border)] text-foreground/60'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-[500px]">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <h2 className="font-display italic text-2xl text-[var(--foreground)]">
              {activeCategory === 'All' ? 'All Bakes' : activeCategory}
            </h2>
            <div className="flex items-center gap-4">
              <select 
                value={sort} 
                onChange={e => setSort(e.target.value)}
                className="bg-transparent text-sm font-ui text-[var(--muted-foreground)] focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A-Z</option>
              </select>
              <span className="font-ui text-[10px] tracking-[0.1em] uppercase text-[var(--muted-foreground)]">
                {filteredProducts.length} Items
              </span>
            </div>
          </div>

          {loading ? (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-4 md:gap-5 space-y-4 md:space-y-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 break-inside-avoid">
                  <div className="w-full aspect-[4/5] rounded-3xl skeleton" />
                  <div className="px-1">
                    <div className="h-5 w-3/4 rounded-full skeleton mb-2" />
                    <div className="h-4 w-1/3 rounded-full skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="font-display italic text-[var(--brand-deep-rose)] text-6xl mb-4">Oops!</span>
              <h3 className="font-display font-bold text-2xl text-[var(--foreground)] mb-2">Something went wrong</h3>
              <p className="font-editorial text-[var(--muted-foreground)]">
                We couldn't load the products at this time. Please try again.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-8 btn-primary px-6 py-3 text-[10px]"
              >
                Try Again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="font-display italic text-[var(--brand-champagne)] text-6xl mb-4">?</span>
              <h3 className="font-display font-bold text-2xl text-[var(--foreground)] mb-2">Nothing found</h3>
              <p className="font-editorial text-[var(--muted-foreground)]">
                Try adjusting your filters or searching for something else.
              </p>
              <button 
                onClick={() => {setSearchQuery(''); setActiveCategory('All');}}
                className="mt-8 btn-primary px-6 py-3 text-[10px]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="columns-2 md:columns-3 xl:columns-4 gap-4 md:gap-5 space-y-4 md:space-y-5">
              {filteredProducts.map((product, idx) => (
                <div key={product.id} className="break-inside-avoid mb-5">
                  <ProductCard product={product} idx={idx} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="font-ui text-xs font-bold uppercase tracking-wider disabled:opacity-30 transition-opacity"
              >
                Prev
              </button>
              <span className="font-editorial text-sm text-[var(--muted-foreground)]">
                Page {page} of {totalPages}
              </span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="font-ui text-xs font-bold uppercase tracking-wider disabled:opacity-30 transition-opacity"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--brand-champagne)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <MenuPageContent />
    </Suspense>
  );
}
