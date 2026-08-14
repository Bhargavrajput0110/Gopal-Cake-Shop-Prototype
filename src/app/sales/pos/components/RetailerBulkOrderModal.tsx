"use client"

import * as React from "react"
import { useCart } from "@/context/CartContext"
import { Box, CloseCircle, DiscountShape, Shop, Profile2User, Add, Minus, Trash, TickCircle } from "iconsax-react"

interface Retailer {
  id: string
  name: string
  contact: string
  adminDiscountPercent: number
  creditLimit: string
  tier: "Gold" | "Platinum" | "Standard" | "Custom"
}

const DEFAULT_RETAILERS: Retailer[] = [
  { id: "ret-01", name: "Rajesh Bakery & Sweets", contact: "9825011223", adminDiscountPercent: 25, creditLimit: "₹1,50,000", tier: "Platinum" },
  { id: "ret-02", name: "Cafe Monarch & Lounge", contact: "9909988776", adminDiscountPercent: 30, creditLimit: "₹2,00,000", tier: "Platinum" },
  { id: "ret-03", name: "Shakti Event Caterers & Co.", contact: "9876543210", adminDiscountPercent: 20, creditLimit: "₹75,000", tier: "Gold" },
  { id: "ret-04", name: "Gokul Dairy & Snacks (Sayaji Road)", contact: "9426033445", adminDiscountPercent: 35, creditLimit: "₹3,00,000", tier: "Platinum" },
  { id: "ret-05", name: "Royal Food Court (Airport Road)", contact: "9898012345", adminDiscountPercent: 20, creditLimit: "₹1,00,000", tier: "Standard" }
]

interface BulkProduct {
  id: string
  name: string
  category: string
  baseRetailPrice: number
  minBulkOrder: number
  unit: string
}

const BULK_CATALOG: BulkProduct[] = [
  { id: "blk-01", name: "Butterscotch Premium Pastries (Box of 10)", category: "Pastries", baseRetailPrice: 600, minBulkOrder: 5, unit: "Boxes" },
  { id: "blk-02", name: "Black Forest Classic Pastries (Box of 10)", category: "Pastries", baseRetailPrice: 550, minBulkOrder: 5, unit: "Boxes" },
  { id: "blk-03", name: "1kg Dutch Truffle Cake (Standard Wholesale Pack)", category: "Cakes", baseRetailPrice: 850, minBulkOrder: 5, unit: "Cakes" },
  { id: "blk-04", name: "0.5kg Pineapple Delight Cake", category: "Cakes", baseRetailPrice: 450, minBulkOrder: 10, unit: "Cakes" },
  { id: "blk-05", name: "Paneer Puff (Crate of 50 Pcs)", category: "Savouries", baseRetailPrice: 1250, minBulkOrder: 2, unit: "Crates" },
  { id: "blk-06", name: "Cheese Corn Cocktail Puff (Crate of 50 Pcs)", category: "Savouries", baseRetailPrice: 1500, minBulkOrder: 2, unit: "Crates" },
  { id: "blk-07", name: "Gourmet Cookies Variety Cartoons (5 kg Bulk)", category: "Bakery Dry", baseRetailPrice: 2200, minBulkOrder: 1, unit: "Carton" },
]

interface RetailerBulkOrderModalProps {
  onClose: () => void
}

export function RetailerBulkOrderModal({ onClose }: RetailerBulkOrderModalProps) {
  const { addItem } = useCart()
  const [selectedRetailer, setSelectedRetailer] = React.useState<Retailer>(DEFAULT_RETAILERS[0])
  const [isAddingCustom, setIsAddingCustom] = React.useState(false)
  const [customName, setCustomName] = React.useState("")
  const [customDiscount, setCustomDiscount] = React.useState(20)
  
  // Quantities for products
  const [quantities, setQuantities] = React.useState<Record<string, number>>({
    "blk-01": 10,
    "blk-03": 5,
  })
  
  const [dispatchDate, setDispatchDate] = React.useState("Tomorrow Morning (6:00 AM Factory Dispatch)")
  const [dispatchNotes, setDispatchNotes] = React.useState("Pack in reusable yellow crates for transport.")
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)

  const activeDiscount = isAddingCustom ? Number(customDiscount) : selectedRetailer.adminDiscountPercent

  // Calculate totals
  let grossTotal = 0
  let totalUnits = 0
  
  Object.entries(quantities).forEach(([prodId, qty]) => {
    if (qty <= 0) return
    const prod = BULK_CATALOG.find(p => p.id === prodId)
    if (prod) {
      grossTotal += prod.baseRetailPrice * qty
      totalUnits += qty
    }
  })
  
  const discountAmount = Math.round((grossTotal * activeDiscount) / 100)
  const netWholesalePayable = grossTotal - discountAmount

  const handleQtyChange = (id: string, newQty: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, newQty)
    }))
  }

  const handleTransferToCart = () => {
    const partnerName = isAddingCustom ? (customName.trim() || "Custom Retailer") : selectedRetailer.name
    
    let addedCount = 0
    Object.entries(quantities).forEach(([prodId, qty]) => {
      if (qty <= 0) return
      const prod = BULK_CATALOG.find(p => p.id === prodId)
      if (prod) {
        const discountedUnitPrice = Math.round(prod.baseRetailPrice * (1 - activeDiscount / 100))
        
        addItem({
          productId: `b2b-${prod.id}-${Date.now()}`,
          name: `📦 [B2B Wholesale] ${prod.name} (${partnerName} - ${activeDiscount}% Admin Rate)`,
          price: discountedUnitPrice,
          quantity: qty,
          weight: 1, // Default placeholder weight for bulk box/crate unit
          flavor: `B2B Unit: ${prod.unit} | Dispatch: ${dispatchDate}`,
          notes: `Wholesale Partner: ${partnerName} | Discount: ${activeDiscount}% | Notes: ${dispatchNotes}`,
        })
        addedCount++
      }
    })

    if (addedCount > 0) {
      setShowSuccessToast(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } else {
      alert("Please specify quantity for at least one bulk item before adding to order.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-[1100px] h-[92vh] max-h-[850px] shadow-2xl border border-border flex flex-col overflow-hidden relative text-foreground">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-border bg-gradient-to-r from-[var(--brand-deep-rose)]/10 via-amber-500/10 to-[var(--brand-champagne)]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-deep-rose)] text-white flex items-center justify-center shadow-lg shadow-[var(--brand-deep-rose)]/20">
              <Box className="w-7 h-7" variant="Bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.15em] bg-amber-500/20 text-amber-900 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  ⚡ Warashiya Outlet Exclusive
                </span>
                <span className="text-[11px] font-black uppercase tracking-[0.15em] bg-emerald-500/15 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  🏷️ Admin-Decided Pricing
                </span>
              </div>
              <h2 className="text-2xl font-black font-display text-foreground mt-1">
                B2B Retailer & Wholesale Bulk Order Portal
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white hover:bg-muted border border-border flex items-center justify-center text-foreground transition-all shadow-sm hover:rotate-90"
          >
            <CloseCircle className="w-7 h-7 text-muted-foreground" />
          </button>
        </div>

        {/* Modal Content - 2 Column Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Retailer Partner Selection & Discount */}
          <div className="w-[380px] shrink-0 border-r border-border bg-muted/20 p-6 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-1 flex items-center gap-2">
                <Shop className="w-4 h-4 text-primary" /> 1. Select B2B Retailer
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Wholesale discounts are decided by management per retailer.
              </p>

              {/* Retailer Selector Option Tabs */}
              <div className="space-y-2.5">
                {DEFAULT_RETAILERS.map(ret => {
                  const isSelected = !isAddingCustom && selectedRetailer.id === ret.id
                  return (
                    <div 
                      key={ret.id}
                      onClick={() => { setSelectedRetailer(ret); setIsAddingCustom(false); }}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? "border-[var(--brand-deep-rose)] bg-white shadow-md ring-2 ring-[var(--brand-deep-rose)]/10" 
                          : "border-border bg-white/70 hover:bg-white hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">{ret.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          ret.tier === "Platinum" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}>
                          {ret.tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60 text-xs">
                        <span className="text-muted-foreground font-semibold">Admin Rate:</span>
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          ⭐ {ret.adminDiscountPercent}% Wholesale OFF
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Custom Retailer Button */}
                <div 
                  onClick={() => setIsAddingCustom(true)}
                  className={`p-3.5 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center ${
                    isAddingCustom 
                      ? "border-[var(--brand-deep-rose)] bg-white shadow-md font-extrabold" 
                      : "border-border hover:border-primary/50 bg-white/40 text-muted-foreground"
                  }`}
                >
                  ➕ Add Custom / New Retailer Partner
                </div>
              </div>

              {/* Custom Retailer Form Fields */}
              {isAddingCustom && (
                <div className="mt-3 p-4 rounded-2xl bg-white border border-[var(--brand-deep-rose)]/30 space-y-3 shadow-sm animate-in fade-in">
                  <div>
                    <label className="text-xs font-bold block mb-1">Retailer / Catering Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mahavir Sweets & Bakers"
                      value={customName}
                      onChange={e => setCustomName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1 flex items-center justify-between">
                      <span>Authorized Admin Discount (%) *</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-black">Manager Approved</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        value={customDiscount}
                        onChange={e => setCustomDiscount(Math.min(90, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-24 px-3 py-1.5 rounded-xl border border-input bg-background text-sm font-black text-center text-emerald-600"
                      />
                      <span className="text-xs font-semibold text-muted-foreground">% OFF Retail Base Price</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dispatch & Packaging Notes */}
            <div className="mt-auto space-y-3 pt-4 border-t border-border">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">
                  🚚 Factory Dispatch Schedule
                </label>
                <input 
                  type="text" 
                  value={dispatchDate}
                  onChange={e => setDispatchDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-input bg-white shadow-2xs"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-foreground block mb-1">
                  📦 Packaging & Logistics Note
                </label>
                <textarea 
                  rows={2} 
                  value={dispatchNotes}
                  onChange={e => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-input bg-white shadow-2xs resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Bulk Catalog Table & Live Calculation */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            
            {/* Catalog List Header */}
            <div className="p-5 border-b border-border bg-muted/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black text-foreground">
                  2. Select Bulk Catalog Items & Quantities
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter quantity in wholesale boxes or crates. Wholesale price reflects {isAddingCustom ? customName || "Custom Partner" : selectedRetailer.name}'s <strong className="text-emerald-600">{activeDiscount}% discount</strong>.
                </p>
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-xl text-xs font-black">
                {BULK_CATALOG.length} Wholesale SKUs
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-2.5 bg-muted/40 border-b border-border text-[11px] font-black uppercase tracking-wider text-muted-foreground shrink-0">
              <div className="col-span-6">Wholesale SKU / Description</div>
              <div className="col-span-2 text-right">Retail Rate</div>
              <div className="col-span-2 text-right">Admin B2B Rate</div>
              <div className="col-span-2 text-center">Bulk Qty</div>
            </div>

            {/* Catalog Items Scroll Area */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {BULK_CATALOG.map(prod => {
                const qty = quantities[prod.id] || 0
                const b2bRate = Math.round(prod.baseRetailPrice * (1 - activeDiscount / 100))
                
                return (
                  <div key={prod.id} className="grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-muted/30 transition-colors">
                    <div className="col-span-6 pr-4">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded mr-2">
                        {prod.category}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Min: {prod.minBulkOrder} {prod.unit}
                      </span>
                      <p className="text-sm font-black text-foreground mt-1.5 leading-tight">{prod.name}</p>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-xs font-bold text-muted-foreground line-through">₹{prod.baseRetailPrice}</span>
                      <p className="text-[10px] text-muted-foreground">per {prod.unit}</p>
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-sm font-black text-emerald-600">₹{b2bRate}</span>
                      <p className="text-[10px] font-extrabold text-emerald-700">Save ₹{prod.baseRetailPrice - b2bRate}</p>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                      <div className="flex items-center border border-border rounded-xl bg-background shadow-xs overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => handleQtyChange(prod.id, (quantities[prod.id] || 0) - (prod.unit === "Crates" || prod.unit === "Boxes" ? 1 : 5))}
                          className="w-8 h-9 flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                        >
                          {qty <= 0 ? <Trash className="w-4 h-4 text-muted-foreground opacity-30" /> : <Minus className="w-4 h-4 text-foreground" />}
                        </button>
                        <input 
                          type="number"
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) => handleQtyChange(prod.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center text-sm font-black bg-transparent border-none focus:outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => handleQtyChange(prod.id, (quantities[prod.id] || 0) + (prod.unit === "Crates" || prod.unit === "Boxes" ? 1 : 5))}
                          className="w-8 h-9 flex items-center justify-center hover:bg-muted text-foreground font-bold transition-colors"
                        >
                          <Add className="w-4 h-4 text-[var(--brand-deep-rose)]" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Sticky B2B Financial Footer Bar */}
            <div className="p-6 border-t border-border bg-muted/20 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Total Bulk Units</span>
                    <span className="text-2xl font-black text-foreground">{totalUnits} Units</span>
                  </div>
                  <div className="h-10 w-px bg-border"></div>
                  <div>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Standard Retail Gross</span>
                    <span className="text-xl font-bold text-muted-foreground line-through">₹{grossTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-10 w-px bg-border"></div>
                  <div>
                    <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block flex items-center gap-1">
                      <DiscountShape className="w-4 h-4" /> Admin Wholesale Discount ({activeDiscount}%)
                    </span>
                    <span className="text-xl font-black text-emerald-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[var(--brand-deep-rose)] font-extrabold uppercase tracking-widest block">Net B2B Payable Amount</span>
                  <span className="text-4xl font-black font-display text-[var(--brand-deep-rose)]">₹{netWholesalePayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-4 rounded-2xl border border-border hover:bg-muted bg-white font-bold text-xs uppercase tracking-wider text-foreground transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleTransferToCart}
                  disabled={totalUnits === 0}
                  className="px-8 py-4 rounded-2xl bg-[var(--brand-deep-rose)] hover:bg-[var(--brand-deep-rose)]/90 text-white font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-[var(--brand-deep-rose)]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 flex items-center gap-3"
                >
                  <span>🛒 Transfer Wholesale Items to POS Cart</span>
                  <span className="w-6 h-6 rounded-full bg-white text-[var(--brand-deep-rose)] flex items-center justify-center font-black text-sm">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Toast / Modal Overlay */}
        {showSuccessToast && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 text-center max-w-md shadow-2xl border border-border animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-emerald-200">
                <TickCircle className="w-12 h-12" variant="Bold" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">Bulk Order Loaded!</h3>
              <p className="text-sm text-muted-foreground font-medium mb-6">
                Successfully transferred <strong className="text-foreground">{totalUnits} wholesale items</strong> to your POS checkout cart with <strong className="text-emerald-600">{activeDiscount}% admin discount</strong> applied for <strong className="text-foreground">{isAddingCustom ? customName : selectedRetailer.name}</strong>!
              </p>
              <div className="p-3 rounded-xl bg-muted/50 text-xs font-extrabold text-[var(--brand-deep-rose)]">
                Redirecting to POS Terminal Cart...
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
