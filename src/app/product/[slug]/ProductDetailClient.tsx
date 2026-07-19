"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { Star1, ShieldCross, Cake, ShoppingCart, ArrowLeft, Refresh2 } from "iconsax-react";
import { BackButton } from "@/components/ui/BackButton";

interface Product {
  productId: string;
  name: string;
  slug: string;
  price: number;
  categoryId: string;
  images: string[];
  status: string;
  description?: string;
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  reviewerName: string;
  createdAt: string;
}

export default function ProductDetailClient({ product }: { product: Product }) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Gallery images fallback
  const galleryImages = product.images && product.images.length > 0
    ? product.images
    : ["https://images.unsplash.com/photo-1578985545062-69928b1d9587"];

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${product.productId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }
    loadReviews();
  }, [product.productId]);

  // Compute average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "No ratings yet";

  return (
    <div className="min-h-screen bg-background pt-28 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <BackButton 
        fallback="/menu" 
        label="Back to Menu" 
        variant="link" 
        className="px-0 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors mb-8" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden border border-border bg-card shadow-[0_10px_40px_-15px_rgba(246,201,214,0.5)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImageIdx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full relative"
              >
                <Image
                  src={galleryImages[activeImageIdx]}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Thumbnail list */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIdx === idx ? "border-primary scale-95 shadow-md" : "border-border/50 opacity-60 hover:opacity-100 hover:border-primary/50"
                  }`}
                >
                  <Image src={imgUrl} alt={`${product.name} thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Pricing */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] bg-muted text-foreground px-3 py-1.5 rounded-full font-bold tracking-wider uppercase border border-border">
                {product.categoryId.replace("-", " ")}
              </span>
              {reviews.length > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full">
                  <Star1 className="w-3.5 h-3.5 fill-secondary" />
                  {averageRating} ({reviews.length} review{reviews.length > 1 ? "s" : ""})
                </span>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              {product.name}
            </h1>
            
            {/* Price indicator */}
            <div className="mt-4 flex flex-col">
              <span className="font-serif font-bold text-3xl text-secondary">
                ₹{product.price}
              </span>
              <span className="text-xs text-foreground/60 mt-1 uppercase tracking-wider font-semibold">
                Starting price (approx. 500g cake)
              </span>
            </div>
          </div>

          <Separator className="bg-border opacity-50" />

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3">Description</h3>
            <p className="text-foreground/80 text-[15px] leading-relaxed font-serif italic">
              {product.description || "A delicious premium cake handcrafted to perfection. Every slice is a perfect harmony of moist sponge, rich cream, and exquisite flavours. Perfect for celebrations or daily cravings."}
            </p>
          </div>

          {/* Ingredients & Allergens Section */}
          <div className="bg-muted/30 border border-border rounded-2xl p-5 flex gap-4">
            <ShieldCross className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Ingredients & Allergens</h4>
              <p className="text-[11px] text-foreground/70 leading-relaxed font-medium">
                Contains wheat flour (gluten), dairy products, and sugar. Baked in a facility that handles nuts and soy.
                Eggless options are available on request during checkout.
              </p>
            </div>
          </div>

          {/* CTA Ordering Button */}
          <div className="pt-2">
            <Link href={`/custom?weight=1kg&flavour=Chocolate&slug=${product.slug}`}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold uppercase tracking-widest py-7 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-transform hover:-translate-y-1">
                <ShoppingCart className="w-5 h-5" />
                Order This Cake (Customize)
              </Button>
            </Link>
          </div>

          <Separator className="bg-border opacity-50 my-2" />

          {/* Reviews Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/80 flex items-center gap-2">
              Customer Reviews ({reviews.length})
            </h3>

            {loadingReviews ? (
              <div className="flex items-center gap-2 text-xs text-foreground/60 py-4">
                <Refresh2 className="w-4 h-4 animate-spin text-primary" /> Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-6 text-center text-xs text-foreground/60">
                No reviews yet for this product. Be the first to order and write one!
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-4 shadow-[0_2px_10px_-4px_rgba(246,201,214,0.3)] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-xs text-foreground">{review.reviewerName}</span>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star1
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "fill-secondary text-secondary" : "text-border fill-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-foreground/50 font-medium">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-[13px] text-foreground/80 italic font-serif leading-relaxed pt-1">
                        &quot;{review.comment}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
