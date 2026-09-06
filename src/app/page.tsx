import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { QualityDescription } from "@/components/home/QualityDescription";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ShelfCakes } from "@/components/home/ShelfCakes";
import { BouquetSection } from "@/components/home/BouquetSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CategoryCardsNav } from "@/components/home/CategoryCardsNav";
import { Suspense } from "react";
import { PageColorWrapper } from "@/components/home/PageColorWrapper";

export default function Home() {
  return (
    <PageColorWrapper>
      {/* Hero — full viewport cinematic */}
      <Suspense
        fallback={
          <div className="min-h-screen bg-[var(--brand-chocolate)] flex items-center justify-center">
            <span className="font-display italic text-white/30 text-2xl">Loading...</span>
          </div>
        }
      >
        <Hero />
      </Suspense>

      {/* Quick Navigation Cards (Mobile UX) */}
      <CategoryCardsNav />

      {/* Trust Marquee Strip — right after hero */}
      <TrustStrip />

      {/* Ready to Pick Shelf Cakes */}
      <div id="fresh-bakes" className="py-24 bg-[var(--brand-deep-rose)]/5 border-y border-[var(--brand-deep-rose)]/10 text-center flex flex-col items-center justify-center px-4">
        <span className="text-secondary font-bold tracking-[0.3em] uppercase text-xs mb-3 block">Daily Selection</span>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Fresh Bakes</h2>
        <p className="font-editorial text-foreground/60 text-lg max-w-xl mx-auto italic mb-8">Our daily selection of freshly baked cookies, brownies, and pastries is currently being perfected.</p>
        <span className="inline-block bg-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20">Coming Soon</span>
      </div>

      {/* Featured Products (Signature Bakes - Core Offering) */}
      <div id="signature-cakes" className="scroll-mt-24">
        <FeaturedProducts />
      </div>

      {/* Florals & Bouquets (Upsell / Cross-sell) */}
      <div id="fresh-florals" className="py-24 bg-background text-center flex flex-col items-center justify-center border-y border-border/40 px-4">
        <span className="text-secondary font-bold tracking-[0.3em] uppercase text-xs mb-3 block">Complementary</span>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">Fresh Florals</h2>
        <p className="font-editorial text-foreground/60 text-lg max-w-xl mx-auto italic mb-8">Beautiful, hand-picked bouquets and floral arrangements to perfectly complement your cake.</p>
        <span className="inline-block border-2 border-primary text-primary px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs">Coming Soon</span>
      </div>

      {/* Brand Legacy + Stats — dark section */}
      <QualityDescription />

      {/* Categories — asymmetric editorial grid */}
      <Categories />

      {/* Social proof / testimonials */}
      <TestimonialsSection />
    </PageColorWrapper>
  );
}
