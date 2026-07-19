"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CloseSquare, Minus, Add, Bag } from "iconsax-react";
import Link from 'next/link';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, subtotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        aria-hidden="true"
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={() => setIsCartOpen(false)}
      />
      <aside aria-label="Shopping Cart" className="fixed inset-y-0 right-0 w-full max-w-md bg-background z-50 shadow-2xl flex flex-col theme-public border-l">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Bag className="w-5 h-5" />
            Your Cart
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-muted rounded-full">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Bag className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-bold text-lg">Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 p-3 bg-muted/20 rounded-xl border">
                <div className="w-16 h-16 bg-muted rounded-lg shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                    <button onClick={() => removeItem(item.cartItemId)} className="text-muted-foreground hover:text-destructive">
                      <CloseSquare className="w-4 h-4" />
                    </button>
                  </div>
                  {item.variant && <p className="text-xs text-muted-foreground mt-0.5">{item.variant}</p>}
                  {item.messageOnCake && <p className="text-xs text-primary mt-0.5 italic truncate">"{item.messageOnCake}"</p>}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border rounded-lg bg-background overflow-hidden">
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-1 hover:bg-muted"><Minus className="w-4 h-4" /></button>
                      <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} className="p-1 hover:bg-muted"><Add className="w-4 h-4" /></button>
                    </div>
                    <span className="font-black">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-muted/10">
            <div className="flex justify-between items-center mb-4 text-lg">
              <span className="font-bold text-muted-foreground">Subtotal</span>
              <span className="font-black">₹{subtotal}</span>
            </div>
            <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full flex items-center justify-center bg-primary text-primary-foreground h-14 rounded-xl font-black text-lg hover:bg-primary/90 shadow-md">
              Proceed to Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
