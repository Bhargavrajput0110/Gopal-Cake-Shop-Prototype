"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { WEIGHT_OPTIONS, getActiveFlavours } from '@/lib/flavours';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import Image from 'next/image';

export function QuickBuyForm({ product, onClose }: { product: any, onClose?: () => void }) {
  const { addItem } = useCart();
  const flavours = getActiveFlavours();
  
  const [selectedWeight, setSelectedWeight] = useState("500g");
  const [selectedFlavour, setSelectedFlavour] = useState("");

  // Calculate dynamic price based on weight (mocking the basePrices logic)
  const basePrices: Record<string, number> = {
    "250g": 350, "500g": 600, "750g": 850, "1kg": 1100,
    "1.5kg": 1600, "2kg": 2100, "2.5kg": 2600, "3kg": 3100,
    "3.5kg": 3500, "4kg": 4000, "4.5kg": 4400, "5kg": 4900,
    "5.5kg": 5300, "6kg": 5800, "6.5kg": 6300, "7kg": 6800,
    "7.5kg": 7300, "8kg": 7800, "8.5kg": 8300, "9kg": 8300, "9.5kg": 8750, "10kg": 9200,
  };
  
  // Use product base price if available and if we are at base weight, otherwise use our lookup table
  // Assuming base weight is 500g
  let currentPrice = product.basePrice || 600;
  if (selectedWeight && basePrices[selectedWeight]) {
      // Scale price appropriately, assuming basePrice is for 500g
      const scale = basePrices[selectedWeight] / basePrices["500g"];
      currentPrice = Math.round(currentPrice * scale);
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      image: product.thumbnail,
      variant: selectedWeight,
      flavor: selectedFlavour || "Classic",
    });
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Image */}
      <div className="relative w-full h-[250px] bg-muted shrink-0">
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-editorial italic">No Image</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h2 className="text-2xl font-display font-bold text-white leading-tight">{product.name}</h2>
          {product.category?.name && (
            <p className="text-white/80 font-editorial italic text-sm">{product.category.name}</p>
          )}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        
        {/* Weight Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Weight
          </label>
          <Popover>
            <PopoverTrigger className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 flex items-center justify-between font-normal hover:bg-background focus:border-primary">
                {selectedWeight ? WEIGHT_OPTIONS.find(w => w.value === selectedWeight)?.label : "Choose weight"}
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0 z-[200]">
              <div className="max-h-[300px] overflow-y-auto w-full flex flex-col py-1">
                {WEIGHT_OPTIONS.map((w) => (
                  <button 
                    key={w.value} 
                    onClick={() => setSelectedWeight(w.value)}
                    className="w-full text-left px-4 py-3 text-base hover:bg-accent focus:bg-accent outline-none"
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Flavour Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Flavour <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
          </label>
          <Popover>
            <PopoverTrigger className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 flex items-center justify-between font-normal hover:bg-background focus:border-primary">
                {selectedFlavour ? (selectedFlavour === 'original' ? 'Original Flavour (Recommended)' : selectedFlavour) : "Original Flavour"}
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0 z-[200]">
              <div className="max-h-[300px] overflow-y-auto w-full flex flex-col py-1">
                <button 
                  onClick={() => setSelectedFlavour("original")}
                  className="w-full text-left px-4 py-3 text-base font-semibold text-primary hover:bg-accent focus:bg-accent outline-none"
                >
                  Original Flavour (Recommended)
                </button>
                {flavours.map((f) => (
                  <button 
                    key={f.id} 
                    onClick={() => setSelectedFlavour(f.name)}
                    className="w-full text-left px-4 py-3 text-base hover:bg-accent focus:bg-accent outline-none"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {/* Footer Checkout */}
      <div className="p-4 bg-background border-t border-border/40 shrink-0">
        <Button 
          onClick={handleAddToCart}
          className="w-full h-14 rounded-2xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-ui font-bold text-sm tracking-widest uppercase shadow-lg shadow-[var(--brand-deep-rose)]/20 hover:-translate-y-1 transition-all"
        >
          Add to Cart - ₹{currentPrice}
        </Button>
      </div>
    </div>
  );
}
