"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { ProductGrid } from "./components/ProductGrid"
import { CartPanel } from "./components/CartPanel"
import { CustomerSelector } from "./components/CustomerSelector"
import { PaymentDialog } from "./components/PaymentDialog"
import { ReceiptStub } from "./components/ReceiptStub"
import { useCart } from "@/context/CartContext"
import { TickCircle, ArrowLeft, Reserve } from "iconsax-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function POSPage() {
  const { clearCart } = useCart()
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [successOrder, setSuccessOrder] = React.useState<string | null>(null)

  // Fetch only active, POS enabled products.
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      try {
        const res = await fetchClient<any>('/products')
        const payload = res.data || res;
        const items = payload.items || payload;
        const filtered = (Array.isArray(items) ? items : []).filter((p: any) => p.availableForSale !== false && !p.isArchived);
        if (filtered.length > 0) return filtered;
      } catch (e) {
        console.warn("API failed, falling back to mock products");
      }
      
      // Fallback Mock Data for UI Prototyping
      return [
        { id: "prod-01", name: "2kg Chocolate Truffle Custom", price: 1200, categoryId: "cat-01", isCustomizable: true, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400" },
        { id: "prod-02", name: "Butterscotch Pastry", price: 60, categoryId: "cat-02", isCustomizable: false, imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400" },
        { id: "prod-03", name: "3 Tier Wedding Cake", price: 5500, categoryId: "cat-01", isCustomizable: true, imageUrl: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=400" },
        { id: "prod-04", name: "Black Forest Classic", price: 450, categoryId: "cat-01", isCustomizable: true, imageUrl: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400" },
        { id: "prod-05", name: "Paneer Puff", price: 30, categoryId: "cat-03", isCustomizable: false, imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568a70950?w=400" },
      ]
    }
  })

  // Fetch only active categories for the POS
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      try {
        const res = await fetchClient<any>('/categories')
        const items = res.data || res;
        const filtered = (Array.isArray(items) ? items : []).filter((c: any) => c.status === 'active');
        if (filtered.length > 0) return filtered;
      } catch (e) {
        console.warn("API failed, falling back to mock categories");
      }
      
      // Fallback Mock Data
      return [
        { categoryId: "cat-01", name: "Cakes" },
        { categoryId: "cat-02", name: "Pastries" },
        { categoryId: "cat-03", name: "Savouries" },
      ]
    }
  })

  const handleCheckoutSuccess = (orderId: string) => {
    setIsPaymentOpen(false)
    setSuccessOrder(orderId)
    clearCart() 
  }

  // Success Screen
  if (successOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] animate-in fade-in zoom-in duration-500 p-4 bg-background">
        <div className="relative w-full max-w-md z-10">
          <div className="bg-white border border-border shadow-xl rounded-[2.5rem] p-10 text-center relative overflow-hidden flex flex-col items-center">
            
            <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mb-8 border border-emerald-200 shadow-sm">
              <TickCircle className="w-12 h-12 text-emerald-600" variant="Bold" />
            </div>
            
            <h1 className="font-display text-4xl font-black text-foreground mb-2">Payment Secured</h1>
            <p className="font-editorial italic text-muted-foreground mb-8 text-xl">
              Order #<span className="font-ui font-black text-[var(--brand-deep-rose)] tracking-widest">{successOrder.split('-')[0].toUpperCase()}</span>
            </p>
            
            <div className="flex flex-col gap-4 w-full">
              <div className="flex-1 text-left bg-muted/50 border border-border rounded-2xl overflow-hidden p-1">
                <ReceiptStub orderId={successOrder} />
              </div>
              <button 
                className="w-full py-5 bg-[var(--brand-deep-rose)] text-white rounded-2xl font-ui text-[11px] uppercase font-black tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                onClick={() => setSuccessOrder(null)}
              >
                <Reserve className="w-5 h-5" /> Start New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground relative">
      
      {/* POS Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-white shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/sales" className="p-3 bg-muted hover:bg-muted/80 border border-border rounded-full text-foreground transition-colors shadow-sm">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-black text-foreground tracking-tight leading-none">Point of Sale</h1>
            <p className="font-ui text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Terminal 01
            </p>
          </div>
        </div>
        <div className="w-80 relative z-50">
          <CustomerSelector />
        </div>
      </header>

      {/* POS Body */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6 z-10 relative max-w-[1440px] mx-auto w-full">
        {/* Left Side: Product Grid / Form */}
        <div className="flex-1 h-full min-w-[500px]">
          <ProductGrid products={products} categories={categories} isLoading={isLoadingProducts || isLoadingCategories} />
        </div>

        {/* Right Side: Cart */}
        <div className="w-[420px] shrink-0 h-full">
          <CartPanel onCheckout={() => setIsPaymentOpen(true)} />
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isPaymentOpen && (
          <PaymentDialog 
            onClose={() => setIsPaymentOpen(false)}
            onSuccess={handleCheckoutSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
