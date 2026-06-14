import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { InfiniteCarousel } from "@/components/home/InfiniteCarousel";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505]">
      <Suspense fallback={<div className="min-h-[85vh] bg-secondary flex items-center justify-center">Loading...</div>}>
        <Hero />
      </Suspense>
      <FeaturedProducts />
      <InfiniteCarousel />
      <Categories />
    </div>
  );
}
