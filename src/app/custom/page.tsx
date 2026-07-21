"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { QuickBuyForm } from "@/components/menu/QuickBuyForm";
import { motion } from "framer-motion";

export default function CustomPage() {
  const [mode, setMode] = useState<"custom" | "photo">("custom");

  const customProduct = {
    id: mode === "custom" ? "custom-build" : "photo-cake",
    name: mode === "custom" ? "Build Your Custom Cake" : "Edible Photo Print Cake",
    basePrice: 600,
    category: { name: mode === "custom" ? "Bespoke Creation" : "Photo Cake" },
    thumbnail: null // We will rely on their upload
  };

  return (
    <div className="min-h-screen bg-background pb-32 pt-24 md:pt-32">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <BackButton fallback="/menu" label="Back to Catalogue" variant="link" className="px-0 mb-6 text-foreground/60 hover:text-primary uppercase tracking-widest text-xs font-bold" />
        
        <div className="mb-10 border-b border-border/40 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-sans font-bold text-secondary tracking-[0.3em] uppercase block mb-3">Tailored Experience</span>
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground leading-[1.1]">
              Bring your <span className="italic font-light text-secondary">Vision</span> to life
            </h1>
            <p className="mt-4 font-editorial text-foreground/60 max-w-lg">
              {mode === "custom" 
                ? "Upload your reference design, select your desired weight and flavour, and let our artisans craft your perfect cake."
                : "Upload your personal photo and we'll print it directly onto your cake using high-quality edible ink."}
            </p>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex bg-muted rounded-full p-1 w-full md:w-auto shrink-0">
            <button 
              onClick={() => setMode("custom")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${mode === "custom" ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Custom Design
            </button>
            <button 
              onClick={() => setMode("photo")}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${mode === "photo" ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Photo Cake
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={mode}
          className="max-w-md mx-auto border-2 border-border/40 rounded-3xl overflow-hidden shadow-2xl bg-card"
        >
          <QuickBuyForm 
            product={customProduct} 
            isCustom={mode === "custom"}
            isPhotoCake={mode === "photo"}
            onClose={() => {
              // Scroll to top or show success toast (handled by QuickBuyForm inherently pushing to cart)
            }} 
          />
        </motion.div>
      </div>
    </div>
  );
}
