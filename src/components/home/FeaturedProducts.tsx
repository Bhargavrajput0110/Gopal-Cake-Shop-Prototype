"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight2 } from "iconsax-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QuickBuyForm } from "@/components/menu/QuickBuyForm";
import { useCart } from "@/context/CartContext";

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

function FeaturedProductCard({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const aspectClass = "aspect-[4/5]";
  const { items, updateQuantity, removeItem } = useCart();

  const cartItem = items.find(
    (i) =>
      (i.productId === product.id || i.designId === product.id) &&
      !i.flavor &&
      !i.messageOnCake &&
      !i.notes,
  );
  const qty = cartItem?.quantity ?? 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{
          duration: 0.7,
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
          {product.thumbnail || product.imageUrl ? (
            <Image
              src={product.thumbnail || product.imageUrl}
              alt={product.name || "Cake"}
              fill
              unoptimized={true}
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
            <svg
              className="w-2.5 h-2.5"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M6 0l1.5 4.5H12l-3.7 2.7 1.4 4.5L6 9.3 2.3 11.7l1.4-4.5L0 4.5h4.5z" />
            </svg>
            <span>Signature</span>
          </div>

          {/* Floating Quick Action */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] z-10">
            <div className="w-10 h-10 rounded-full bg-[var(--brand-deep-rose)] text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
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
        <div className="flex flex-col px-2 mt-3">
          <div
            onClick={() => setIsOpen(true)}
            className="flex flex-col mb-2 cursor-pointer"
          >
            <h3 className="font-display font-bold text-base md:text-lg text-[var(--foreground)] group-hover:text-[var(--brand-deep-rose)] transition-colors duration-300 leading-snug line-clamp-1">
              {product.name}
            </h3>
            {product.category?.name && (
              <p className="font-editorial italic text-[var(--muted-foreground)] text-xs line-clamp-1">
                {product.category.name}
              </p>
            )}
          </div>

          {/* Price row + stepper/add */}
          <div className="flex items-center justify-between mt-auto pt-1">
            <div
              className="flex flex-col cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <p className="font-ui text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-semibold mb-0.5">
                Starting from
              </p>
              <p className="font-ui text-sm font-bold text-[var(--foreground)]">
                {product.basePrice ? `₹${product.basePrice}` : "Custom Pricing"}
              </p>
            </div>

            {/* Quantity Stepper or ADD button */}
            {qty > 0 ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-0 bg-[var(--brand-deep-rose)]/10 rounded-full border border-[var(--brand-deep-rose)]/30 overflow-hidden"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (qty === 1 && cartItem) removeItem(cartItem.cartItemId);
                    else if (cartItem)
                      updateQuantity(cartItem.cartItemId, qty - 1);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[var(--brand-deep-rose)] font-bold text-lg hover:bg-[var(--brand-deep-rose)]/15 transition-colors rounded-l-full"
                >
                  −
                </button>
                <span className="w-7 text-center font-ui text-[13px] font-black text-[var(--brand-deep-rose)]">
                  {qty}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-[var(--brand-deep-rose)] font-bold text-lg hover:bg-[var(--brand-deep-rose)]/15 transition-colors rounded-r-full"
                >
                  +
                </button>
              </motion.div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
                className="px-4 py-2 bg-[var(--brand-deep-rose)] text-white hover:bg-[var(--brand-deep-rose)]/90 transition-all rounded-full font-ui text-[10px] font-bold uppercase tracking-[0.1em] shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                ADD {product.basePrice ? `₹${product.basePrice}` : ""}
              </button>
            )}
          </div>
        </div>
      </motion.div>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 bg-background z-[150] border-l-0 shadow-2xl"
      >
        <QuickBuyForm
          product={product}
          isCustom={
            product.isCustom || product.name.toLowerCase().includes("custom")
          }
          isPhotoCake={false}
          onClose={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export function FeaturedProducts() {
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState<any[]>([
    { id: "all", name: "All" },
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/v1/designs?limit=500")
        .then((res) => (res.ok ? res.json() : { data: { items: [] } }))
        .catch(() => ({ data: { items: [] } })),
      fetch("/api/v1/public/products?limit=500")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("/api/v1/categories")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ])
      .then(([designsRes, productsRes, categoriesRes]) => {
        // Process categories
        const fetchedCats = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.data || [];
        const formattedCats = [
          { id: "all", name: "All" },
          ...fetchedCats.filter((c: any) => c.name),
        ];
        setCategories(formattedCats);

        let apiDesigns = designsRes?.data?.items || [];

        // Merge with local storage designs (Phase 1 prototype memory)
        try {
          const localStr =
            typeof window !== "undefined"
              ? localStorage.getItem("gopal_saved_designs")
              : null;
          if (localStr) {
            const localDesigns = JSON.parse(localStr);
            if (Array.isArray(localDesigns)) {
              // Replace API designs with local ones if they match by ID or Code
              const localMap = new Map(
                localDesigns.map((d) => [d.id || d.code, d]),
              );
              apiDesigns = apiDesigns.map(
                (d: any) => localMap.get(d.id || d.code) || d,
              );
              // Add any local designs that are completely new
              const apiIds = new Set(
                apiDesigns.map((d: any) => d.id || d.code),
              );
              localDesigns.forEach((d) => {
                if (!apiIds.has(d.id || d.code)) apiDesigns.unshift(d);
              });
            }
          }
        } catch (e) {}

        const allDesigns = apiDesigns
          .filter(
            (d: any) => !(d.imageUrl || d.thumbnail || "").startsWith("blob:"),
          )
          .map((d: any) => {
            let computedPrice = d.basePrice ? Number(d.basePrice) : 0;
            let hasMultipleOptions = false;
            let wc = d.weightConfig;
            if (typeof wc === "string") {
              try {
                wc = JSON.parse(wc);
              } catch (e) {}
            }
            if (wc && typeof wc === "object" && Object.keys(wc).length > 0) {
              const weights = Object.keys(wc)
                .map(Number)
                .sort((a, b) => a - b);
              if (weights.length > 0 && wc[weights[0]]?.price) {
                computedPrice = Number(wc[weights[0]].price);
                if (weights.length > 1) hasMultipleOptions = true;
              }
            } else if (d.basePrice) {
              computedPrice = Number(d.basePrice);
            }

            let thumb = d.imageUrl || d.thumbnail || "";
            if (
              !thumb ||
              thumb.includes("example.com") ||
              thumb.includes("sample.jpg") ||
              thumb.includes("mock") ||
              thumb.startsWith("blob:")
            ) {
              thumb =
                "https://images.unsplash.com/photo-1601050690597-df0568a70950?w=600&auto=format&fit=crop&q=80";
            }
            return {
              ...d,
              thumbnail: thumb,
              isCustom: true,
              name: d.name || "Custom Cake Design",
              basePrice: computedPrice || 600,
              hasMultipleOptions,
            };
          });

        const productsList = (
          Array.isArray(productsRes) ? productsRes : productsRes?.data || []
        ).map((p: any) => {
          let thumb = p.thumbnail || p.imageUrl || "";
          if (
            !thumb ||
            thumb.includes("example.com") ||
            thumb.includes("sample.jpg") ||
            thumb.includes("mock")
          ) {
            thumb =
              "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80";
          }

          let hasMultipleOptions = false;
          if (p.variants && p.variants.length > 1) hasMultipleOptions = true;

          return { ...p, thumbnail: thumb, hasMultipleOptions };
        });

        const combined: any[] = [];
        const seen = new Set();
        [...allDesigns, ...productsList].forEach((item: any) => {
          // Deduplicate aggressively by name to prevent same-named Design & Product duplicates
          const key = item.name?.toLowerCase().trim() || item.code || item.id;
          if (key && !seen.has(key)) {
            seen.add(key);
            combined.push(item);
          }
        });

        setAllProducts(combined);
        setProducts(combined.slice(0, 12));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === "All") {
      setProducts(allProducts.slice(0, 12));
      return;
    }
    const targetCategory = activeCategory.toLowerCase().trim();
    
    const filtered = allProducts.filter((item) => {
      // Check design categories structure
      if (item.categories && Array.isArray(item.categories)) {
        if (
          item.categories.some(
            (c: any) =>
              (c.category?.name || "").toLowerCase().trim() === targetCategory ||
              c.categoryId === activeCategory,
          )
        ) {
          return true;
        }
      }
      
      // Check product category structure
      const catName = (item.category?.name || item.category || "").toLowerCase().trim();
      
      if (
        catName === targetCategory ||
        item.categoryId === activeCategory
      ) {
        return true;
      }
      
      return false;
    });
    setProducts(filtered);
  }, [activeCategory, allProducts]);

  return (
    <section className="py-28 md:py-36 bg-[var(--background)] overflow-hidden relative">
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] -z-10 blur-3xl"
        style={{ background: "var(--brand-deep-rose)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.04] -z-10 blur-3xl"
        style={{ background: "var(--brand-champagne)" }}
      />

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
            <h2
              className="font-display font-bold text-[var(--foreground)] leading-[0.92]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 5rem)" }}
            >
              Signature
              <span className="block font-display italic font-normal text-[var(--brand-deep-rose)]">
                Bakes
              </span>
            </h2>
            <p className="font-editorial text-[var(--muted-foreground)] text-lg mt-4 leading-relaxed max-w-sm">
              Freshly crafted every morning, with love and the finest
              ingredients.
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

        {/* ── Category Filters ── */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-10 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-ui text-sm font-bold transition-all border ${
                activeCategory === cat.name
                  ? "bg-[var(--brand-deep-rose)] border-[var(--brand-deep-rose)] text-white shadow-md"
                  : "bg-white text-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/5 border-[var(--brand-deep-rose)]/30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Product Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products
              .filter((p) => {
                if (activeCategory === "All") return true;
                if (
                  activeCategory === "Signature" &&
                  p.categories?.some((c: any) =>
                    c.category?.name?.toLowerCase().includes("signature"),
                  )
                )
                  return true;
                if (activeCategory === "Custom" && p.isCustom) return true;

                // Check exact category match
                if (p.categories && Array.isArray(p.categories)) {
                  if (
                    p.categories.some(
                      (c: any) =>
                        c.category?.name === activeCategory ||
                        c.categoryId === activeCategory,
                    )
                  ) {
                    return true;
                  }
                }
                if (
                  p.category?.name === activeCategory ||
                  p.categoryId === activeCategory ||
                  p.category === activeCategory
                ) {
                  return true;
                }

                // General text search in tags/name as fallback
                const searchStr =
                  `${p.name} ${(p.tags || []).join(" ")} ${(p.labels || []).join(" ")}`.toLowerCase();
                return searchStr.includes(activeCategory.toLowerCase());
              })
              .slice(0, 12)
              .map((product) => {
                return (
                  <FeaturedProductCard key={product.id} product={product} />
                );
              })}
          </div>
        )}
      </div>
    </section>
  );
}
