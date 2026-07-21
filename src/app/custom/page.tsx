"use client";

import { BackButton } from "@/components/ui/BackButton";
import { QuickBuyForm } from "@/components/menu/QuickBuyForm";
import { motion } from "framer-motion";

export default function CustomPage() {
  const customProduct = {
    id: "custom-build",
    name: "Build Your Custom Cake",
    basePrice: 600,
    category: { name: "Bespoke Creation" },
    thumbnail: null // We will rely on their upload
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-24 md:pt-32">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <BackButton fallback="/menu" label="Back to Catalogue" variant="link" className="mb-6 text-foreground/80 hover:text-primary uppercase tracking-widest text-xs font-bold" />
        
        <div className="mb-12 border-b border-border/40 pb-6">
          <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Tailored Experience</span>
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">
            Bring your <span className="italic font-light text-secondary">Vision</span> to life
          </h1>
          <p className="mt-4 font-editorial text-foreground/60 max-w-lg">
            Upload your reference design, select your desired weight and flavour, and let our artisans craft your perfect cake.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto border-2 border-border/40 rounded-3xl overflow-hidden shadow-2xl bg-card"
        >
          <QuickBuyForm 
            product={customProduct} 
            isCustom={true} 
            onClose={() => {
              // Scroll to top or show success toast (handled by QuickBuyForm inherently pushing to cart)
            }} 
          />
        </motion.div>
      </div>
    </div>
  );
}
