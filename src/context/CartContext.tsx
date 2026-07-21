"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type CartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  
  // Configurations
  weight?: number;
  variant?: string;
  flavor?: string;
  messageOnCake?: string;
  shape?: string;
  notes?: string;
  boxCount?: number;
  
  // Custom Designs & Images
  designId?: string;
  designCode?: string;
  designName?: string;
  designImageUrl?: string;
  referenceImages?: string[];
  printImage?: string;
  isPhotoCake?: boolean;
  isCustomizable?: boolean;
};

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartItemId'> & { cartItemId?: string }) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemConfig: (cartItemId: string, config: Partial<CartItem>) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  
  // POS Specific Session Data
  customerId: string | null;
  setCustomer: (id: string | null) => void;
  discountCode: string | null;
  setDiscount: (code: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children, storageKey = 'customer-cart' }: { children: React.ReactNode, storageKey?: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [customerId, setCustomer] = useState<string | null>(null);
  const [discountCode, setDiscount] = useState<string | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setItems(parsed.items || []);
        setCustomer(parsed.customerId || null);
        setDiscount(parsed.discountCode || null);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Save to sessionStorage on change
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(storageKey, JSON.stringify({ items, customerId, discountCode }));
    }
  }, [items, customerId, discountCode, isLoaded, storageKey]);

  const addItem = (item: Omit<CartItem, 'cartItemId'> & { cartItemId?: string }) => {
    setItems(prev => {
      // For POS and custom products, we always treat them as independent cart items to support custom config.
      // We will match on productId and variant only if it's a simple exact match without custom config.
      const hasCustomConfig = item.flavor || item.messageOnCake || item.designId || item.referenceImages?.length || item.printImage || item.notes;
      
      if (!hasCustomConfig) {
        const existing = prev.find(i => i.productId === item.productId && i.variant === item.variant && !i.flavor && !i.messageOnCake && !i.designId && !i.notes);
        if (existing) {
          return prev.map(i => 
            i.cartItemId === existing.cartItemId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }
      }

      const newItem: CartItem = {
        ...item,
        cartItemId: item.cartItemId || `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      
      return [...prev, newItem];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  };

  const updateItemConfig = (cartItemId: string, config: Partial<CartItem>) => {
    setItems(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, ...config } : i));
  };

  const removeItem = (cartItemId: string) => {
    setItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
    setCustomer(null);
    setDiscount(null);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items, addItem, updateQuantity, updateItemConfig, removeItem, clearCart, 
      totalItems, subtotal, isCartOpen, setIsCartOpen,
      customerId, setCustomer, discountCode, setDiscount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
