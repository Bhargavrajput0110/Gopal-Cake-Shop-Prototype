"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { fetchClient } from "@/lib/api/client"
import { ProductGrid } from "@/app/sales/pos/components/ProductGrid"
import { CartPanel } from "@/app/sales/pos/components/CartPanel"
import { CustomerSelector } from "@/app/sales/pos/components/CustomerSelector"
import { PaymentDialog } from "@/app/sales/pos/components/PaymentDialog"
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub"
import { RetailerBulkOrderModal } from "@/app/sales/pos/components/RetailerBulkOrderModal"
import { useCart } from "@/context/CartContext"
import { BRANCHES, toBranchId, type BranchId } from "@/lib/branches"
import { TickCircle, ArrowLeft, Reserve, Box, Shop, DocumentDownload, Copy } from "iconsax-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export default function AdminCreateOrderPage() {
  const { clearCart } = useCart()
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [successOrder, setSuccessOrder] = React.useState<string | null>(null)
  const [isQuoteOrder, setIsQuoteOrder] = React.useState<boolean>(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = React.useState(false)
  
  const { data: session } = useSession()
  
  const defaultBranch = (session?.user?.branchId as BranchId) || "uma"
  const [activeBranch, setActiveBranch] = React.useState<BranchId>(defaultBranch)

  React.useEffect(() => {
    if (session?.user?.branchId) {
      setActiveBranch(session.user.branchId as BranchId)
    }
  }, [session?.user?.branchId])

  // Fetch only active, POS enabled products.
  const { data: products = [], isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['pos-products'],
    queryFn: async () => {
      try {
        const res = await fetchClient<any>('/products')
        const payload = res.data || res;
        const items = payload.items || payload;
        const filtered = (Array.isArray(items) ? items : []).filter((p: any) => p.availableForSale !== false && !p.isArchived);
        if (filtered.length > 0) return filtered;
      } catch (e) {
        console.warn("API failed for products");
      }
      
      // In production and development: throw so the UI shows a proper error instead of mock data
      throw new Error('Product catalog unavailable. Check database connection.')
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
        console.error("API failed for categories", e);
        if (typeof window !== 'undefined') {
          alert("Unable to load product categories. Please contact the manager.");
        }
        return [];
      }
    }
  })

  // Fetch Design Library cakes — these have real Cloudinary images
  const { data: designs = [] } = useQuery({
    queryKey: ['pos-designs'],
    queryFn: async () => {
      try {
        const res = await fetchClient<any>('/designs?limit=100&status=ACTIVE')
        const payload = res.data || res;
        const items = payload.items || payload;
        return (Array.isArray(items) ? items : []).filter((d: any) => d.imageUrl && d.status !== 'ARCHIVED');
      } catch (e) {
        console.warn('Failed to load designs', e);
        return [];
      }
    }
  })

  const handleCheckoutSuccess = (orderId: string, isQuote?: boolean) => {
    setIsPaymentOpen(false)
    setSuccessOrder(orderId)
    setIsQuoteOrder(!!isQuote)
    clearCart() 
  }

  // Success Screen
  if (successOrder) {
    if (isQuoteOrder) {
      const quoteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quote/${successOrder}`
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] animate-in fade-in zoom-in duration-500 p-4 bg-background">
          <div className="relative w-full max-w-md z-10">
            <div className="bg-white border border-border shadow-xl rounded-[2.5rem] p-10 text-center relative overflow-hidden flex flex-col items-center">
              
              <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mb-8 border border-purple-200 shadow-sm">
                <DocumentDownload className="w-12 h-12 text-purple-600" variant="Bold" />
              </div>
              
              <h1 className="font-display text-4xl font-black text-foreground mb-2">Quote Generated</h1>
              <p className="font-editorial italic text-muted-foreground mb-8 text-xl">
                Ready to send to customer!
              </p>
              
              <div className="flex flex-col gap-4 w-full">
                <div className="flex-1 text-left bg-purple-50 border border-purple-200 rounded-2xl overflow-hidden p-4 relative group">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">Customer Link</p>
                  <p className="font-mono text-xs text-purple-900 break-all">{quoteUrl}</p>
                </div>
                
                <button 
                  className="w-full py-5 bg-purple-600 text-white rounded-2xl font-ui text-[11px] uppercase font-black tracking-[0.2em] hover:opacity-90 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(quoteUrl);
                    alert('Copied to clipboard!');
                  }}
                >
                  <Copy className="w-5 h-5" /> Copy Link
                </button>
                <button 
                  className="w-full py-4 bg-white text-muted-foreground border border-border rounded-2xl font-ui text-[11px] uppercase font-black tracking-[0.2em] hover:bg-muted transition-all active:scale-[0.98]"
                  onClick={() => {
                    setSuccessOrder(null)
                    setIsQuoteOrder(false)
                  }}
                >
                  Start New Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

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
                onClick={() => {
                  setSuccessOrder(null)
                  setIsQuoteOrder(false)
                }}
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
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-border bg-white shrink-0 z-20 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="p-3 bg-muted hover:bg-muted/80 border border-border rounded-full text-foreground transition-colors shadow-sm shrink-0">
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">Admin Create Order</h1>
                
                {/* Active Branch Terminal Switcher */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-muted/50 border border-border rounded-xl px-2 py-1 sm:px-3 sm:py-1">
                  <Shop className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-black text-xs uppercase tracking-wider text-foreground">
                    {BRANCHES.find(b => b.id === activeBranch)?.displayName || 'BRANCH'}
                  </span>
                </div>
              </div>
  
              <p className="font-ui text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Terminal 01 • Active Outlet: {BRANCHES.find(b => b.id === activeBranch)?.shortName}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-50">
          {/* WARASIYA OUTLET EXCLUSIVE BULK ORDERS BUTTON */}
          {activeBranch === 'varasiya' && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-[var(--brand-deep-rose)] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
            >
              <Box className="w-5 h-5 text-white animate-bounce" variant="Bold" />
              <span>📦 Retailer Bulk Order</span>
              <span className="text-[9px] bg-white text-amber-950 px-2 py-0.5 rounded-full font-black uppercase tracking-tight shadow-2xs ml-1">
                WARASIYA B2B
              </span>
            </motion.button>
          )}

          <div className="w-full sm:w-80 mt-2 md:mt-0">
            <CustomerSelector />
          </div>
        </div>
      </header>

      {/* POS Body */}
      <main className="flex-1 flex flex-col xl:flex-row overflow-y-auto xl:overflow-hidden p-2 sm:p-6 gap-6 z-10 relative max-w-[1440px] mx-auto w-full pb-24 xl:pb-6">
        {/* Left Side: Product Grid / Form */}
        <div className="flex-1 w-full xl:h-full xl:min-w-[500px]">
          <ProductGrid products={products} categories={categories} designs={designs} isLoading={isLoadingProducts || isLoadingCategories} />
        </div>

        {/* Right Side: Cart */}
        <div className="w-full xl:w-[420px] shrink-0 xl:h-full">
          <CartPanel onCheckout={() => setIsPaymentOpen(true)} onSuccess={handleCheckoutSuccess} />
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

      {/* Warasiya B2B Retailer Bulk Order Modal */}
      {isBulkModalOpen && (
        <RetailerBulkOrderModal onClose={() => setIsBulkModalOpen(false)} />
      )}
    </div>
  )
}

