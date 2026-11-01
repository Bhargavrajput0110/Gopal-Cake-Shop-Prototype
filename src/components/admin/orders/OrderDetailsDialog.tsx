'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OrderTimelineViewer } from "./OrderTimelineViewer"
import { PaymentDetailsViewer } from "./PaymentDetailsViewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QualityControlChecklist } from "@/components/chef/QualityControlChecklist"
import { useQuery } from "@tanstack/react-query"
import { OrdersApiClient } from "@/lib/api/orders.api"
import { Receipt21, CloseSquare, Call, Clock, Location, Bag, Image as ImageIcon } from "iconsax-react"
import { ChefHat, ZoomIn, CheckCircle, X, Sparkles } from "lucide-react"
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub"
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/context/OrderContext"

interface OrderDetailsDialogProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
  onOpenQuote?: (orderId: string) => void
}

export function OrderDetailsDialog({ orderId, isOpen, onClose, onOpenQuote }: OrderDetailsDialogProps) {
  const [showReceipt, setShowReceipt] = React.useState(false)
  const [zoomImage, setZoomImage] = React.useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = React.useState(false)
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null)

  const { transitionOrderAction, refetchOrders } = useOrders()

  const { data: response, refetch } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => orderId ? OrdersApiClient.getOrder(orderId) : Promise.resolve(null),
    enabled: !!orderId && isOpen
  })

  if (!orderId) return null

  const order = response?.data

  const handleChefAction = async (actionVerb: string, feedbackText: string) => {
    if (!orderId) return
    setIsActionLoading(true)
    try {
      await transitionOrderAction(orderId, actionVerb)
      await refetch()
      await refetchOrders()
      setActionFeedback(feedbackText)
      setTimeout(() => setActionFeedback(null), 3000)
    } catch (e: any) {
      console.error(e)
      alert(e?.message || "Failed to update order status.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Extract all media and reference photos
  const allImages = React.useMemo(() => {
    if (!order?.items) return []
    const list: string[] = []
    order.items.forEach((item: any) => {
      if (item.image) list.push(item.image)
      if (item.designImageUrl) list.push(item.designImageUrl)
      if (item.media && Array.isArray(item.media)) {
        item.media.forEach((m: any) => {
          if (m.url && !list.includes(m.url)) list.push(m.url)
        })
      }
    })
    return list
  }, [order])

  const formatTargetTime = (dateStr?: string) => {
    if (!dateStr) return "Standard SLA"
    try {
      const d = new Date(dateStr)
      return `${d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} (${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="p-5 pb-4 shrink-0 border-b border-border bg-secondary/15 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-500 text-white rounded-xl text-lg shrink-0 shadow-xs">
                🎂
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black text-foreground">
                    Order #{order?.orderNumber || orderId.slice(-6)}
                  </DialogTitle>
                  {order?.status && (
                    <Badge variant="outline" className="uppercase text-[10px] font-black tracking-wider">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {order?.deliveryType && (
                    <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                      {order.deliveryType}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Complete cake specifications, kitchen production ticket, and order details.
                </DialogDescription>
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(true)}
              className="px-3.5 py-2 bg-[#3E2723] text-white rounded-xl text-xs font-bold hover:bg-[#2c1c19] flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0 cursor-pointer"
            >
              <Receipt21 className="w-4 h-4 text-[#C5A059]" /> Print Bill
            </button>
          </DialogHeader>

          {/* Action Feedback Toast */}
          {actionFeedback && (
            <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2 flex items-center gap-2 text-emerald-700 text-xs font-bold animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{actionFeedback}</span>
            </div>
          )}

          <ScrollArea className="flex-1 p-5 bg-background space-y-5">
            <div className="space-y-5">
              
              {/* 1. Customer & Branch Strip */}
              {order && (
                <div className="bg-secondary/30 border border-border/70 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Customer Details</span>
                    <p className="font-black text-sm text-foreground mt-0.5">{order.customer?.name || "Walk-in Customer"}</p>
                    {order.customer?.phone && (
                      <a 
                        href={`tel:${order.customer.phone}`}
                        className="text-primary hover:underline font-bold flex items-center gap-1 mt-0.5"
                      >
                        <Call className="w-3.5 h-3.5" /> {order.customer.phone}
                      </a>
                    )}
                    {order.deliveryAddress && (
                      <p className="text-muted-foreground flex items-center gap-1 mt-1 text-[11px]">
                        <Location className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> {order.deliveryAddress}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Fulfillment</span>
                    <span className="px-2.5 py-1 bg-background border border-border rounded-lg font-bold text-xs text-foreground inline-block">
                      🏪 {order.branch?.name || order.branchId || "Branch"}
                    </span>
                    <p className="text-[11px] text-muted-foreground font-semibold flex items-center sm:justify-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> Target: {formatTargetTime(order.targetDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Chef Workflow Control Bar for Admin */}
              {order && (
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4 text-amber-600" /> Kitchen Workflow Controls (Admin & Chef)
                    </span>
                    <span className="text-[11px] font-bold text-amber-800">
                      Current Stage: <strong className="uppercase">{order.status.replace(/_/g, ' ')}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {order.status === "QUOTE_DRAFT" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => {
                          onClose()
                          onOpenQuote?.(order.id)
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                      >
                        Set Price & Send Quote &rarr;
                      </button>
                    )}

                    {order.status === "QUOTE_SENT" && (
                      <>
                        <button
                          disabled={isActionLoading}
                          onClick={() => {
                            onClose()
                            onOpenQuote?.(order.id)
                          }}
                          className="px-3 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Modify Quote Price
                        </button>
                        <button
                          disabled={isActionLoading}
                          onClick={() => handleChefAction("approve", "Order approved and sent directly to Kitchen! 🎂")}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                          {isActionLoading ? "Updating…" : "Approve → Kitchen Queue"}
                        </button>
                      </>
                    )}

                    {order.status === "WAITING_FOR_CHEF" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleChefAction("chef-accept", "Kitchen ticket accepted! Chef is preparing ingredients. 👨‍🍳")}
                        className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ChefHat className="w-4 h-4" />
                        {isActionLoading ? "Processing…" : "Accept Ticket (Start Kitchen Prep)"}
                      </button>
                    )}

                    {order.status === "CHEF_ACCEPTED" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleChefAction("start-making", "Baking started! Cake is in production. 🍰")}
                        className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isActionLoading ? "Processing…" : "Start Baking (Making)"}
                      </button>
                    )}

                    {order.status === "MAKING" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleChefAction("start-decorating", "Decorating started! Cake icing and detailing in progress. 🎨")}
                        className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isActionLoading ? "Processing…" : "Start Decorating & Icing"}
                      </button>
                    )}

                    {order.status === "DECORATING" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleChefAction("ready", "Order marked Ready for Pickup! Customer notified via WhatsApp. 📦")}
                        className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isActionLoading ? "Processing…" : "Mark Ready for Pickup"}
                      </button>
                    )}

                    {order.status === "READY_FOR_PICKUP" && (
                      <button
                        disabled={isActionLoading}
                        onClick={() => handleChefAction("complete", "Order handed over to customer and marked Complete! 🍰")}
                        className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isActionLoading ? "Processing…" : "Hand Over & Complete Order"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Cake Reference Photos Gallery */}
              {allImages.length > 0 && (
                <div className="border border-border/80 rounded-xl p-4 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" /> Cake Reference Photos ({allImages.length})
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-semibold">Click image to enlarge</span>
                  </div>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                    {allImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setZoomImage(imgUrl)}
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-border/80 overflow-hidden shrink-0 relative group cursor-pointer bg-secondary/20 shadow-xs"
                      >
                        <img src={imgUrl} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black uppercase transition-opacity gap-1">
                          <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Cake Items & Specifications */}
              <div className="border border-border/80 rounded-xl p-4 bg-card space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Bag className="w-4 h-4 text-primary" /> Cake Specifications & Recipe Details
                </h4>

                <div className="space-y-3">
                  {order?.items?.map((item: any, idx: number) => {
                    const weightStr = item.weight ? (item.weight < 1 ? `${item.weight * 1000}g` : `${item.weight}kg`) : null
                    return (
                      <div key={idx} className="bg-secondary/20 border border-border/60 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-sm text-foreground">
                              {item.productName || item.name || "Custom Cake"}
                              {item.quantity > 1 && <span className="text-primary font-bold ml-1.5">× {item.quantity}</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {weightStr && (
                                <span className="px-2 py-0.5 bg-background border border-border rounded-md text-xs font-bold text-foreground">
                                  ⚖️ Size: <strong>{weightStr}</strong>
                                </span>
                              )}
                              {item.flavor && (
                                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-xs font-bold text-amber-900">
                                  🍰 Flavour: <strong>{item.flavor}</strong>
                                </span>
                              )}
                              {item.shape && (
                                <span className="px-2 py-0.5 bg-secondary border border-border rounded-md text-xs font-semibold text-muted-foreground">
                                  Shape: {item.shape}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-sm text-primary">₹{Number(item.price || 0).toFixed(0)}</span>
                        </div>

                        {/* 🎂 MESSAGE ON CAKE */}
                        {item.messageOnCake && (
                          <div className="bg-rose-600 text-white rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 shadow-sm">
                            <span className="text-2xl shrink-0">🎂</span>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">Write on Cake</p>
                              <p className="font-black text-sm font-mono leading-tight">&quot;{item.messageOnCake}&quot;</p>
                            </div>
                          </div>
                        )}

                        {/* Customer Instructions / Notes */}
                        {(item.notes || order?.customerNotes) && (
                          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-blue-900 text-xs font-medium">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block mb-0.5">Special Instructions:</span>
                            {item.notes || order?.customerNotes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 5. Quality Control Checklist */}
              {order && (order.status === 'DECORATING' || order.status === 'READY_FOR_PICKUP' || order.status === 'PENDING_ASSIGNMENT' || order.status === 'COMPLETED') && (
                <QualityControlChecklist 
                  orderId={order.id} 
                  existingQC={order.qualityChecklist as any} 
                  onSuccess={() => refetch()}
                />
              )}

              {/* 6. Payment Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  Payment Information
                </h3>
                <PaymentDetailsViewer payments={order?.ledgerEntries || []} />
              </div>

              {/* 7. Order Timeline */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                  Order Timeline
                </h3>
                <OrderTimelineViewer orderId={orderId} />
              </div>

            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Photo Lightbox */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[10000] flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomImage} alt="Cake Enlarged" className="w-full h-full object-contain max-h-[85vh]" />
          </div>
        </div>
      )}

      {/* Bill & Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full relative p-4 max-h-[90vh] overflow-y-auto my-auto shadow-2xl">
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10 p-1"
            >
              <CloseSquare className="w-6 h-6" />
            </button>
            <ReceiptStub orderId={orderId} onClose={() => setShowReceipt(false)} />
          </div>
        </div>
      )}
    </>
  )
}
