"use client"

import React from "react"
import { CartProvider } from "@/context/CartContext"

export default function PosLayout({ children }: { children: React.ReactNode }) {
  // Wrap the POS in a new CartProvider instance that uses a different storage key
  // This isolates the POS cart from the Customer cart if accessed on the same device
  return (
    <CartProvider storageKey="pos-cart-storage">
      {children}
    </CartProvider>
  )
}
