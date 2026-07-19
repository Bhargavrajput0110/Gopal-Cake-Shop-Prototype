"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "iconsax-react";

const CATEGORIES = ["Bestsellers", "Wedding", "Anniversary", "Birthday", "Designer"];

const CATALOG_DATA: Record<string, { id: string, name: string, price: number, img: string, desc: string }[]> = {
  "Bestsellers": [
    { id: "bs1", name: "Pink Blossom Truffle", price: 1250, img: "https://images.unsplash.com/photo-1621236378699-8597faf6a176?q=80&w=1200&auto=format&fit=crop", desc: "Signature strawberry and rose." },
    { id: "bs2", name: "Strawberry Cloud", price: 950, img: "https://images.unsplash.com/photo-1556217477-d325251ece38?q=80&w=800&auto=format&fit=crop", desc: "Fresh strawberries & light cream." },
    { id: "bs3", name: "Midnight Velvet", price: 1100, img: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=800&auto=format&fit=crop", desc: "Red velvet with mascarpone." },
    { id: "bs4", name: "Golden Hazelnut", price: 1350, img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=1200&auto=format&fit=crop", desc: "Caramelized hazelnut crunch." },
  ],
  "Wedding": [
    { id: "wd1", name: "Ivory Elegance (3-Tier)", price: 4500, img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=1200&auto=format&fit=crop", desc: "Classic white wedding tier." },
    { id: "wd2", name: "Rose Gold cascade", price: 5200, img: "https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?q=80&w=800&auto=format&fit=crop", desc: "Hand-piped buttercream roses." },
    { id: "wd3", name: "Minimalist Pearl", price: 3800, img: "https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop", desc: "Sleek fondant with edible pearls." },
    { id: "wd4", name: "Rustic Naked Cake", price: 3200, img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=1200&auto=format&fit=crop", desc: "Exposed layers with fresh berries." },
  ],
  "Anniversary": [
    { id: "an1", name: "Heart of Passion", price: 1400, img: "https://images.unsplash.com/photo-1579372785631-432f584e031a?q=80&w=1200&auto=format&fit=crop", desc: "Heart-shaped chocolate truffle." },
    { id: "an2", name: "Ruby Romance", price: 1600, img: "https://images.unsplash.com/photo-1582293041079-7814c2f12063?q=80&w=800&auto=format&fit=crop", desc: "Ruby chocolate and raspberry." },
    { id: "an3", name: "Gold Leaf Special", price: 2100, img: "https://images.unsplash.com/photo-1602351447937-745cb7be3067?q=80&w=800&auto=format&fit=crop", desc: "24k edible gold leaf accents." },
    { id: "an4", name: "Floral Number Cake", price: 1800, img: "https://images.unsplash.com/photo-1563729784474-d77dbb938f9b?q=80&w=1200&auto=format&fit=crop", desc: "Custom anniversary years." },
  ],
  "Birthday": [
    { id: "bd1", name: "Confetti Explosion", price: 850, img: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1200&auto=format&fit=crop", desc: "Funfetti sponge inside." },
    { id: "bd2", name: "Choco Overload", price: 1100, img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=800&auto=format&fit=crop", desc: "Topped with macarons and bars." },
    { id: "bd3", name: "Unicorn Fantasy", price: 1300, img: "https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=800&auto=format&fit=crop", desc: "Pastel colors and fondant horn." },
    { id: "bd4", name: "Superhero Shield", price: 1450, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1200&auto=format&fit=crop", desc: "Custom hero fondant design." },
  ],
  "Designer": [
    { id: "ds1", name: "Geometric Noir", price: 2500, img: "https://images.unsplash.com/photo-1621303837174-89787a7d4729?q=80&w=1200&auto=format&fit=crop", desc: "Abstract dark chocolate shards." },
    { id: "ds2", name: "Marble Fondant", price: 2800, img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=800&auto=format&fit=crop", desc: "Hand-painted marble texture." },
    { id: "ds3", name: "Isomalt Splash", price: 3200, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=800&auto=format&fit=crop", desc: "Sugar glass sugar-art waves." },
    { id: "ds4", name: "The Galaxy Cake", price: 2900, img: "https://images.unsplash.com/photo-1614707684222-777c15e8df76?q=80&w=1200&auto=format&fit=crop", desc: "Mirror glaze cosmos effect." },
  ]
};

import { useCart } from "@/context/CartContext";

const CatalogueItemInfo = ({ item, onAdd }: { item: any; onAdd: (item: any) => void }) => (
  <div className="flex flex-col gap-3 mt-4">
    <div className="flex justify-between items-start gap-4">
      <h3 className="font-heading text-2xl md:text-3xl font-medium text-foreground leading-tight">
        {item.name}
      </h3>
      <span className="font-sans font-bold text-foreground shrink-0 text-sm md:text-base tracking-wide">
        ₹{item.price.toLocaleString()}
      </span>
    </div>
    <div className="flex items-center justify-between border-t border-border/50 pt-3">
      <p className="font-sans text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.15em]">
        {item.desc}
      </p>
      <button 
        onClick={(e) => {
          e.preventDefault();
          onAdd({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.img
          });
        }}
        className="shrink-0"
      >
        <span className="font-sans text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:text-foreground transition-colors border-b border-primary hover:border-foreground pb-0.5">
          Add to Cart
        </span>
      </button>
    </div>
  </div>
);

const HoverOverlay = ({ id }: { id: string }) => (
  <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-700 ease-out flex flex-col justify-center items-center pointer-events-none">
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-background/95 text-primary flex flex-col items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-sm shadow-xl">
      <span className="font-sans font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Add</span>
      <ArrowRight className="w-4 h-4" />
    </div>
  </div>
);

export function InteractiveCategoryExplorer() {
  const { addItem } = useCart();
  const [activeCategory, setActiveCategory] = useState("Bestsellers");
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Phase 2.5: Use local static catalogue for the landing page explorer
    // to avoid fetching legacy /api/categories and /api/products.
    const cats = CATEGORIES.map(c => ({ categoryId: c, name: c, status: 'active' }));
    setCategories(cats);
    
    // Flatten CATALOG_DATA into allProducts
    const all = CATEGORIES.flatMap(cat => 
      (CATALOG_DATA[cat] || []).map(item => ({
        productId: item.id,
        categoryId: cat,
        name: item.name,
        price: item.price,
        images: [item.img],
        description: item.desc,
        status: 'active'
      }))
    );
    setAllProducts(all);
    setActiveCategory(CATEGORIES[0]);
    setIsLoading(false);
  }, []);

  const activeItems = allProducts
    .filter(p => p.categoryId === activeCategory)
    .map(p => ({ ...p, id: p.productId, img: p.images?.[0] || '', desc: p.description || '' })) || [];
  
  if (isLoading) {
    return <div className="w-full bg-background pt-24 pb-40 flex items-center justify-center">Loading catalogue...</div>;
  }

  return (
    <section className="w-full bg-background pt-24 pb-40 text-foreground overflow-hidden relative z-20">
      <div className="w-full">
        
        {/* Header & Tabs */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="font-heading text-5xl md:text-7xl font-medium tracking-tight mb-4 uppercase">
                Explore <span className="italic font-light text-primary">Catalogue.</span>
              </h2>
            </div>
  
            <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar pb-2 md:pb-0 border-b border-border/50">
              {categories.map(category => (
                <button
                  key={category.categoryId}
                  onClick={() => setActiveCategory(category.categoryId)}
                  className={`relative pb-4 text-xs font-sans font-bold uppercase tracking-[0.15em] transition-colors whitespace-nowrap ${
                    activeCategory === category.categoryId ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {activeCategory === category.categoryId && (
                    <motion.div
                      layoutId="activeCategoryBorder"
                      className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-primary z-10"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Magazine/Catalogue Spread Grid */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
            >
              {/* Item 1: Featured Image (Spans 7 cols) */}
              {activeItems[0] && (
                <div className="md:col-span-7 flex flex-col group cursor-pointer">
                  <div className="block relative w-full aspect-[4/3] md:aspect-video bg-secondary overflow-hidden rounded-xl" onClick={() => addItem({productId: activeItems[0].id, name: activeItems[0].name, price: activeItems[0].price, quantity: 1, image: activeItems[0].img})}>
                    <Image
                      src={activeItems[0].img}
                      alt={activeItems[0].name}
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      quality={90}
                      priority
                      className="object-cover transition-transform duration-[2000ms] group-hover:scale-105 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                    <HoverOverlay id={activeItems[0].id} />
                  </div>
                  <CatalogueItemInfo item={activeItems[0]} onAdd={addItem} />
                </div>
              )}

              {/* Stacked Right Column for Item 2 & 3 */}
              <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
                {activeItems[1] && (
                  <div className="flex flex-col group cursor-pointer">
                    <div className="block relative w-full aspect-[5/4] md:aspect-video bg-secondary overflow-hidden rounded-xl" onClick={() => addItem({productId: activeItems[1].id, name: activeItems[1].name, price: activeItems[1].price, quantity: 1, image: activeItems[1].img})}>
                      <Image
                        src={activeItems[1].img}
                        alt={activeItems[1].name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-[2000ms] group-hover:scale-105 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      <HoverOverlay id={activeItems[1].id} />
                    </div>
                    <CatalogueItemInfo item={activeItems[1]} onAdd={addItem} />
                  </div>
                )}
                
                {activeItems[2] && (
                  <div className="flex flex-col group cursor-pointer">
                    <div className="block relative w-full aspect-[5/4] md:aspect-video bg-secondary overflow-hidden rounded-xl" onClick={() => addItem({productId: activeItems[2].id, name: activeItems[2].name, price: activeItems[2].price, quantity: 1, image: activeItems[2].img})}>
                      <Image
                        src={activeItems[2].img}
                        alt={activeItems[2].name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-[2000ms] group-hover:scale-105 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      <HoverOverlay id={activeItems[2].id} />
                    </div>
                    <CatalogueItemInfo item={activeItems[2]} onAdd={addItem} />
                  </div>
                )}
              </div>

              {/* Item 4: Bottom Banner (Spans 12 cols) */}
              {activeItems[3] && (
                <div className="md:col-span-12 mt-4 md:mt-8 pt-6 md:pt-10 border-t border-border/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center group cursor-pointer">
                    <div className="block relative w-full aspect-[21/9] md:aspect-[32/9] bg-secondary overflow-hidden order-2 md:order-1 rounded-xl" onClick={() => addItem({productId: activeItems[3].id, name: activeItems[3].name, price: activeItems[3].price, quantity: 1, image: activeItems[3].img})}>
                      <Image
                        src={activeItems[3].img}
                        alt={activeItems[3].name}
                        fill
                        sizes="100vw"
                        quality={90}
                        className="object-cover transition-transform duration-[2000ms] group-hover:scale-105 ease-[cubic-bezier(0.16,1,0.3,1)]"
                      />
                      <HoverOverlay id={activeItems[3].id} />
                    </div>
                    <div className="order-1 md:order-2 flex flex-col justify-center py-2">
                      <h3 className="font-heading text-3xl md:text-4xl font-medium text-foreground leading-tight mb-2">
                        {activeItems[3].name}
                      </h3>
                      <p className="font-sans text-xs md:text-sm text-muted-foreground uppercase tracking-[0.1em] mb-4 max-w-sm leading-relaxed">
                        {activeItems[3].desc}
                      </p>
                      <div className="flex items-center gap-6">
                        <span className="font-sans font-bold text-primary text-xl tracking-wide">
                          ₹{activeItems[3].price.toLocaleString()}
                        </span>
                        <button onClick={() => addItem({productId: activeItems[3].id, name: activeItems[3].name, price: activeItems[3].price, quantity: 1, image: activeItems[3].img})} className="px-6 py-3 bg-primary text-primary-foreground font-sans font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-foreground transition-colors duration-300 rounded-full">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* View Entire Catalogue Button */}
        <div className="w-full flex justify-center mt-12 md:mt-16">
          <Link href="/menu">
            <button className="flex items-center gap-4 text-foreground hover:text-primary transition-colors group">
              <span className="font-sans font-bold text-xs uppercase tracking-[0.3em] border-b border-transparent group-hover:border-primary pb-1 transition-colors">
                View Full Catalogue
              </span>
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary transition-colors duration-500">
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Link>
        </div>

      </div>
    </section>
  );
}
