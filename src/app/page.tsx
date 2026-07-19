import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { QualityDescription } from "@/components/home/QualityDescription";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { TrustStrip } from "@/components/home/TrustStrip";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
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

      {/* Trust Marquee Strip — right after hero */}
      <TrustStrip />

      {/* Featured Products */}
      <FeaturedProducts />

      {/* Brand Legacy + Stats — dark section */}
      <QualityDescription />

      {/* Categories — asymmetric editorial grid */}
      <Categories />

      {/* Social proof / testimonials */}
      <TestimonialsSection />
    </div>
  );
}
