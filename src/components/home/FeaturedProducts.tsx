"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { StickyScroll } from "@/components/aceternity/sticky-scroll-reveal";

const products = [
  {
    title: "Premium Truffle",
    description:
      "A rich, moist chocolate cake layered with dark chocolate truffle ganache. Perfectly balanced sweetness for the true connoisseur. Each layer is infused with a subtle hint of Madagascar vanilla, elevating the chocolate experience to unprecedented heights.",
    price: "₹650",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&auto=format&fit=crop",
    id: 1,
  },
  {
    title: "Red Velvet Romance",
    description:
      "Classic crimson layers with a delicate cocoa flavor, stacked high and frosted with our signature, ultra-smooth cream cheese icing. Finished with crushed velvet crumbs, making it the ultimate centerpiece for celebrations of love and joy.",
    price: "₹850",
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1200&auto=format&fit=crop",
    id: 2,
  },
  {
    title: "Ferrero Rocher Special",
    description:
      "Experience luxury with this hazelnut sensation. Moist chocolate sponge enveloped in Nutella buttercream, generously coated with roasted hazelnuts and crowned with actual Ferrero Rocher truffles and gold leaf.",
    price: "₹1200",
    image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=1200&auto=format&fit=crop",
    id: 3,
  },
];

export function FeaturedProducts() {
  const content = products.map((product) => ({
    title: product.title,
    description: (
      <div className="flex flex-col gap-4">
        <p className="text-white/70 text-base md:text-lg leading-relaxed">{product.description}</p>
        <div className="flex items-center gap-6 mt-4">
          <span className="text-2xl font-bold text-[#D4AF37]">{product.price}</span>
          <Link href={`/product/${product.id}`} className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-colors">
            Order Now
          </Link>
        </div>
      </div>
    ),
    content: (
      <div className="w-full h-full relative">
        <Image
          src={product.image}
          alt={product.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    ),
  }));

  return (
    <section className="bg-[#050505] relative z-10 w-full pb-20">
      <div className="w-full">
        {/* Sticky Scroll Component for Desktop/Tablet */}
        <div className="hidden md:block w-full">
          <StickyScroll content={content} />
        </div>

        {/* Mobile View - Fallback to stacked cards for better mobile optimization */}
        <div className="md:hidden flex flex-col gap-10 px-4 mt-12">
          <div className="text-center mb-4">
             <h2 className="font-heading text-4xl font-bold text-white tracking-tight">Trending Now</h2>
             <p className="text-white/60 mt-2 text-lg">Our most loved creations</p>
          </div>
          {products.map((product) => (
            <div key={product.id} className="w-full flex flex-col gap-4">
              <div className="w-full aspect-[4/5] relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="text-3xl font-heading font-bold text-white mb-2">{product.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4 line-clamp-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[#D4AF37]">{product.price}</span>
                  <Link href={`/product/${product.id}`} className="px-6 py-2 bg-white text-black font-bold rounded-full text-sm">
                    Order Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
