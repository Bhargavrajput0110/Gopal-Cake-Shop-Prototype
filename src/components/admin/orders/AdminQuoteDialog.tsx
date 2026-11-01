'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useOrders, type Order } from "@/context/OrderContext"
import { MoneyArchive, Send, CloseCircle, Image as ImageIcon, TickCircle, Call, Clock, Bag } from "iconsax-react"
import { ChefHat } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdminQuoteDialogProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AdminQuoteDialog({ orderId, isOpen, onClose, onSuccess }: AdminQuoteDialogProps) {
  const { orders, updateOrderStatus, updateOrderFields, refetchOrders } = useOrders()
  
  const order = React.useMemo(() => {
    return orders.find(o => o.id === orderId) || null
  }, [orders, orderId])

  const [quotePrice, setQuotePrice] = React.useState<string>("")
  const [selectedDiscount, setSelectedDiscount] = React.useState<number>(0)
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null)

  // Initialize quotePrice when order changes or modal opens
  React.useEffect(() => {
    if (order) {
      const initialPrice = order.grandTotal > 0 ? order.grandTotal.toString() : (order.subtotal > 0 ? order.subtotal.toString() : "")
      setQuotePrice(initialPrice)
      setSelectedDiscount(order.discount || 0)
      setFeedbackMsg(null)
    }
  }, [order, isOpen])

  if (!isOpen || !order) return null

  const priceNum = parseInt(quotePrice, 10) || 0
  const finalTotal = Math.max(0, priceNum - selectedDiscount)
  const cakeItem = order.items?.[0]
  const referenceImage = order.cakeImage || cakeItem?.referenceImages?.[0] || null

  const handleSendAndApprove = async () => {
    if (priceNum <= 0) {
      alert("Please enter a valid quote price greater than ₹0.")
      return
    }
    setIsSubmitting(true)
    try {
      await updateOrderFields(order.id, {
        grandTotal: finalTotal,
        subtotal: priceNum,
        discount: selectedDiscount,
        pendingBalance: finalTotal - (order.advancePaid || 0)
      })
      // 1. Trigger automated WhatsApp quote message with payment link via Meta Cloud API
      await updateOrderStatus(order.id, "QUOTE_SENT", false, "Admin", {
        discount: selectedDiscount,
        basePrice: priceNum
      })
      // 2. Auto-approve to kitchen so chef immediately gets the baking ticket
      await updateOrderStatus(order.id, "WAITING_FOR_CHEF", false, "Admin", {
        discount: selectedDiscount,
        basePrice: priceNum
      })
      await refetchOrders()
      setFeedbackMsg(`Quote of ₹${finalTotal} sent to customer via WhatsApp & auto-approved to Kitchen! 🎂`)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1200)
    } catch (e: any) {
      console.error(e)
      alert(e.message || "Failed to send quote and approve.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApproveOnly = async () => {
    if (priceNum <= 0 && (!order.grandTotal || order.grandTotal <= 0)) {
      alert("Please enter a valid price greater than ₹0 before approving to kitchen.")
      return
    }
    const effectiveTotal = finalTotal > 0 ? finalTotal : (order.grandTotal || 0)
    setIsSubmitting(true)
    try {
      await updateOrderFields(order.id, {
        grandTotal: effectiveTotal,
        subtotal: priceNum > 0 ? priceNum : effectiveTotal,
        discount: selectedDiscount,
        pendingBalance: effectiveTotal - (order.advancePaid || 0)
      })
      await updateOrderStatus(order.id, "WAITING_FOR_CHEF", false, "Admin", {
        discount: selectedDiscount,
        basePrice: priceNum > 0 ? priceNum : effectiveTotal
      })
      await refetchOrders()
      setFeedbackMsg(`Order #${order.orderNumber || order.id.slice(-6)} approved and sent to kitchen for ₹${effectiveTotal}! 🎂`)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1200)
    } catch (e: any) {
      console.error(e)
      alert(e.message || "Failed to approve order to kitchen.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border bg-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500 text-white rounded-xl text-base shrink-0">🎂</span>
              <div>
                <DialogTitle className="text-base font-black text-foreground">
                  Custom Cake Quote #{order.orderNumber || order.id.slice(-6)}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Set customer price, send WhatsApp payment link, or approve directly to kitchen.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="warning" className="uppercase text-[10px] font-bold">
              {order.status === "QUOTE_DRAFT" ? "Draft Quote" : "Quote Sent"}
            </Badge>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Customer & Branch Strip */}
          <div className="bg-secondary/40 border border-border/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground text-sm">{order.customerName}</p>
              <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                <Call className="w-3.5 h-3.5 text-primary" /> {order.customerPhone || "No phone provided"}
              </p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 bg-background border border-border rounded font-bold text-[11px] text-foreground">
                {order.branch}
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" /> Target: {order.timeTarget ? new Date(order.timeTarget).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Standard"}
              </p>
            </div>
          </div>

          {/* Cake Specifications & Photo */}
          <div className="border border-border/80 rounded-xl p-3.5 bg-background space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Bag className="w-3.5 h-3.5 text-primary" /> Cake Specifications
            </h4>
            <div className="flex gap-3 items-start">
              {referenceImage ? (
                <a
                  href={referenceImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0 bg-secondary/30 relative group block"
                  title="Click to view full reference image"
                >
                  <img src={referenceImage} alt="Cake reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                    Zoom
                  </span>
                </a>
              ) : (
                <div className="w-16 h-16 rounded-lg border border-dashed border-border shrink-0 bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground text-[10px]">
                  <ImageIcon className="w-5 h-5 mb-0.5 opacity-40" />
                  No photo
                </div>
              )}
              <div className="flex-1 min-w-0 text-xs space-y-1">
                <p className="font-bold text-foreground truncate">{cakeItem?.name || "Custom Design Cake"}</p>
                {cakeItem?.weight && (
                  <p className="text-muted-foreground">
                    Weight: <strong className="text-foreground">{cakeItem.weight}</strong>
                  </p>
                )}
                {cakeItem?.flavor && (
                  <p className="text-muted-foreground">
                    Flavor: <strong className="text-foreground">{cakeItem.flavor}</strong>
                  </p>
                )}
                {cakeItem?.messageOnCake && (
                  <p className="text-amber-800 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                    &quot;{cakeItem.messageOnCake}&quot;
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Price Entry Section */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                Quote Amount (₹) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-lg text-muted-foreground">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 950"
                  value={quotePrice}
                  onChange={(e) => setQuotePrice(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-background border-2 border-border focus:border-primary rounded-xl font-black text-xl text-foreground outline-none transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Discount Buttons */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Apply Special Discount (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "No Discount (₹0)", val: 0 },
                  { label: "₹50 Off", val: 50 },
                  { label: "₹100 Off", val: 100 },
                  { label: "₹200 Off", val: 200 },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setSelectedDiscount(d.val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDiscount === d.val
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Summary Breakdown */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <p className="text-muted-foreground">
                  Base Price: <strong>₹{priceNum}</strong>
                  {selectedDiscount > 0 && <span className="text-destructive font-bold ml-1.5">-₹{selectedDiscount}</span>}
                </p>
                <p className="text-[10px] text-amber-800/80 mt-0.5">
                  Amount customer pays via payment link
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Customer Price</span>
                <span className="text-xl font-black text-primary">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          {/* Feedback Success Notice */}
          {feedbackMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-700 text-xs font-bold animate-in fade-in">
              <TickCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedbackMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center gap-2">
          {/* Action 1: Send WhatsApp Quote Link & Auto-Approve to Kitchen */}
          <button
            type="button"
            disabled={isSubmitting || priceNum <= 0}
            onClick={handleSendAndApprove}
            className="w-full sm:flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? "Processing…" : `Send Quote & Approve to Kitchen (₹${finalTotal})`}
          </button>

          {/* Action 2: Approve Directly to Kitchen */}
          <button
            type="button"
            disabled={isSubmitting || (priceNum <= 0 && (!order.grandTotal || order.grandTotal <= 0))}
            onClick={handleApproveOnly}
            className="w-full sm:w-auto py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <ChefHat className="w-3.5 h-3.5" />
            {isSubmitting ? "Approving…" : "Approve Kitchen Only"}
          </button>

          {/* Fallback to Sales Desk */}
          <Link
            href={`/sales/orders?search=${order.orderNumber || order.id}`}
            onClick={onClose}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground hover:underline px-2 py-1 text-center shrink-0"
          >
            Sales POS &rarr;
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
