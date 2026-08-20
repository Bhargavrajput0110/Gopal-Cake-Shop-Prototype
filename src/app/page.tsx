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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
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
      <div id="fresh-bakes">
        <ShelfCakes />
      </div>

      {/* Featured Products (Signature Bakes - Core Offering) */}
      <div id="signature-cakes" className="scroll-mt-24">
        <FeaturedProducts />
      </div>

      {/* Florals & Bouquets (Upsell / Cross-sell) */}
      <div id="fresh-florals" className="scroll-mt-24">
        <BouquetSection />
      </div>

      {/* Brand Legacy + Stats — dark section */}
      <QualityDescription />

      {/* Categories — asymmetric editorial grid */}
      <Categories />

      {/* Social proof / testimonials */}
      <TestimonialsSection />
    </div>
  );
}
