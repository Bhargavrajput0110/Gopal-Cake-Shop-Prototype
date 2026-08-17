"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight2, Gift } from "iconsax-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QuickBuyForm } from "@/components/menu/QuickBuyForm";
import { useCart } from "@/context/CartContext";

const SKELETON_COUNT = 4;

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full aspect-[4/5] rounded-3xl skeleton" />
      <div className="flex flex-col gap-2 px-1">
        <div className="h-5 w-3/4 rounded-full skeleton" />
        <div className="h-4 w-1/2 rounded-full skeleton" />
      </div>
    </div>
  );
}

function BouquetProductCard({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const aspectClass = "aspect-[4/5]";
  const { items, updateQuantity, removeItem, addItem } = useCart();

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
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="group flex flex-col break-inside-avoid relative"
      >
        {/* Gift Indicator badge */}
        <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md text-[var(--brand-deep-rose)] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl border border-[var(--brand-deep-rose)]/10">
          <Gift size={14} variant="Bold" />
          <span className="font-ui text-[10px] font-bold uppercase tracking-widest">Perfect Gift</span>
        </div>

        {/* Image Container */}
        <div
          onClick={() => setIsOpen(true)}
          className={`relative w-full ${aspectClass} rounded-[2rem] overflow-hidden bg-[var(--muted)] mb-4 block cursor-pointer border-4 border-transparent hover:border-[#8B2A53]/20 transition-all duration-300`}
        >
          {product.thumbnail || product.imageUrl ? (
            <Image
              src={product.thumbnail || product.imageUrl}
              alt={product.name || "Bouquet"}
              fill
              unoptimized={true}
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[var(--muted)]">
              <span className="font-editorial italic text-[var(--muted-foreground)] text-sm">
                No Image
              </span>
            </div>
          )}

          {/* Quick Order Hover Overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] p-5 pb-6 bg-gradient-to-t from-black/80 to-transparent">
             <span className="font-ui text-[11px] font-bold tracking-[0.1em] uppercase text-white/90">
               Send Love
             </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col px-1">
          <div onClick={() => setIsOpen(true)} className="flex flex-col mb-2 cursor-pointer">
            <h3 className="font-display font-bold text-lg md:text-xl text-[var(--foreground)] group-hover:text-[var(--brand-deep-rose)] transition-colors duration-300 leading-snug line-clamp-1">
              {product.name}
            </h3>
            {product.category?.name && (
              <p className="font-editorial italic text-[var(--muted-foreground)] text-xs line-clamp-1">
                {product.category.name}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex flex-col">
              <p className="font-ui text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-semibold mb-0.5">Starting from</p>
              <p className="font-ui text-sm font-bold text-[var(--foreground)]">
                ₹{product.basePrice}
              </p>
            </div>

            {/* Quick Add logic */}
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
                    else if (cartItem) updateQuantity(cartItem.cartItemId, qty - 1);
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
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    let defaultVariant = "Standard"; // default for non-cake if applicable
                    if (product.weightConfig) {
                      try {
                        const wc = typeof product.weightConfig === 'string' ? JSON.parse(product.weightConfig) : product.weightConfig;
                        if (wc && typeof wc === 'object' && Object.keys(wc).length > 0) {
                           const keys = Object.keys(wc).map(Number).sort((a,b) => a-b);
                           const k = keys[0];
                           defaultVariant = k >= 1 ? `${k}kg` : `${k*1000}g`;
                        }
                      } catch(err) {}
                    }
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.basePrice || 600,
                      basePrice: product.basePrice || 600,
                      quantity: 1,
                      image: product.thumbnail || product.imageUrl || product.image,
                      variant: defaultVariant,
                      flavor: "Classic",
                      isPhotoCake: false
                    });
                  }}
                  className="w-9 h-9 flex items-center justify-center bg-[#8B2A53] text-white hover:bg-[var(--brand-chocolate)] transition-all rounded-full font-bold shadow-md shadow-[var(--brand-deep-rose)]/20"
                  aria-label="Quick Add"
                >
                  <span className="text-lg leading-none mb-0.5">+</span>
                </button>
              </div>
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
            product.isCustom ||
            (product.name || "").toLowerCase().includes("custom")
          }
          isPhotoCake={
            Boolean(product.isPhotoCake) ||
            (product.name || "").toLowerCase().includes("photo") ||
            (product.category?.name || "").toLowerCase().includes("photo")
          }
          onClose={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}

export function BouquetSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/public/products?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const fetched = Array.isArray(data) ? data : (data?.data || []);
        
        // Filter for floral/bouquet products
        const florals = fetched.filter((p: any) => 
          (p.category?.name || "").toLowerCase().includes("bouquet") ||
          (p.name || "").toLowerCase().includes("bouquet") ||
          (p.name || "").toLowerCase().includes("flower") ||
          (p.name || "").toLowerCase().includes("floral") ||
          (p.categories && p.categories.some((c: any) => (c.category?.name || "").toLowerCase().includes("bouquet")))
        );

        // Fallback: If no floral products are found in the DB yet, use these beautiful placeholders
        const fallbackFlorals = [
          {
            id: 'dummy-floral-1',
            name: 'Red Roses Elegance',
            basePrice: 800,
            imageUrl: 'https://images.unsplash.com/photo-1591886960571-74d43a9d4166?q=80&w=600&auto=format&fit=crop',
            category: { name: 'Bouquets' }
          },
          {
            id: 'dummy-floral-2',
            name: 'Blushing Peonies',
            basePrice: 1200,
            imageUrl: 'https://images.unsplash.com/photo-1563241598-4cb98425ec43?q=80&w=600&auto=format&fit=crop',
            category: { name: 'Bouquets' }
          },
          {
            id: 'dummy-floral-3',
            name: 'Sunny Sunflowers',
            basePrice: 650,
            imageUrl: 'https://images.unsplash.com/photo-1557004652-30691cb5282f?q=80&w=600&auto=format&fit=crop',
            category: { name: 'Bouquets' }
          },
          {
            id: 'dummy-floral-4',
            name: 'Premium Orchids',
            basePrice: 1500,
            imageUrl: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?q=80&w=600&auto=format&fit=crop',
            category: { name: 'Bouquets' }
          }
        ];
        
        const itemsToShow = florals.length > 0 ? florals : fallbackFlorals;
        
        setProducts(itemsToShow.slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-24 bg-background overflow-hidden relative border-t border-border/30">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
        
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div className="max-w-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-px bg-[#8B2A53]" />
              <span className="font-ui text-[10px] tracking-[0.35em] uppercase text-[#8B2A53] font-bold flex items-center gap-1.5">
                <Gift size={12} variant="Bold" /> Gifting Collection
              </span>
            </div>
            <h2
              className="font-display font-bold text-[var(--foreground)] leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 4vw, 4rem)" }}
            >
              Florals &
              <span className="block font-display italic font-normal text-[#8B2A53]">
                Bouquets
              </span>
            </h2>
            <p className="font-editorial text-[var(--muted-foreground)] text-base mt-4 leading-relaxed max-w-sm">
              Pair your artisanal cake with beautiful fresh flowers to make their day truly special.
            </p>
          </div>

          <Link
            href="/menu?category=Bouquets"
            className="group flex items-center gap-2 px-6 py-3 rounded-full border border-[#8B2A53]/20 text-[#8B2A53] hover:bg-[#8B2A53] hover:text-white transition-all duration-300 self-start md:self-auto text-xs font-ui font-bold uppercase tracking-widest bg-white/50"
          >
            Shop All Flowers
          </Link>
        </div>

        {/* Horizontal Scroll / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 relative z-10">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))
            : products.map((product) => (
                <BouquetProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
