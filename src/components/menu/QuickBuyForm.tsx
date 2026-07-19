"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { WEIGHT_OPTIONS, getActiveFlavours } from '@/lib/flavours';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { ArrowDown2 } from "iconsax-react";

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 justify-between font-normal hover:bg-background focus:border-primary">
                {selectedWeight ? WEIGHT_OPTIONS.find(w => w.value === selectedWeight)?.label || selectedWeight : "Choose weight"}
                <ArrowDown2 size={20} className="text-muted-foreground ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto z-[200]">
              {WEIGHT_OPTIONS.map((w) => (
                <DropdownMenuItem 
                  key={w.value} 
                  className="text-base py-3 cursor-pointer"
                  onClick={() => setSelectedWeight(w.value)}
                >
                  {w.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Flavour Selection */}
        <div className="space-y-3">
          <label className="font-ui text-xs font-bold uppercase tracking-wider text-foreground">
            Select Flavour <span className="text-muted-foreground font-normal normal-case">(Optional)</span>
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-14 text-lg bg-background border-2 border-border/40 rounded-xl px-4 justify-between font-normal hover:bg-background focus:border-primary">
                {selectedFlavour ? (selectedFlavour === 'original' ? 'Original Flavour (Recommended)' : selectedFlavour) : "Original Flavour (Recommended)"}
                <ArrowDown2 size={20} className="text-muted-foreground ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto z-[200]">
              <DropdownMenuItem 
                className="text-base py-3 font-semibold text-primary cursor-pointer"
                onClick={() => setSelectedFlavour("original")}
              >
                Original Flavour (Recommended)
              </DropdownMenuItem>
              {flavours.map((f) => (
                <DropdownMenuItem 
                  key={f.id} 
                  className="text-base py-3 cursor-pointer"
                  onClick={() => setSelectedFlavour(f.name)}
                >
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
