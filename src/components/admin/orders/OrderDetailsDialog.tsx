'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OrderTimelineViewer } from "./OrderTimelineViewer"
import { PaymentDetailsViewer } from "./PaymentDetailsViewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QualityControlChecklist } from "@/components/chef/QualityControlChecklist"
import { useQuery } from "@tanstack/react-query"
import { OrdersApiClient } from "@/lib/api/orders.api"
import { Receipt21, CloseSquare } from "iconsax-react"
import { ReceiptStub } from "@/app/sales/pos/components/ReceiptStub"

interface OrderDetailsDialogProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsDialog({ orderId, isOpen, onClose }: OrderDetailsDialogProps) {
  const [showReceipt, setShowReceipt] = React.useState(false)

  const { data: response, refetch } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => orderId ? OrdersApiClient.getOrder(orderId) : Promise.resolve(null),
    enabled: !!orderId
  })

  if (!orderId) return null

  const order = response?.data

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 shrink-0 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-serif font-black text-[#3E2723]">Order Details: {orderId}</DialogTitle>
              <DialogDescription>
                View full details, payments, timeline, and quality checklist.
              </DialogDescription>
            </div>
            <button
              onClick={() => setShowReceipt(true)}
              className="px-4 py-2 bg-[#3E2723] text-white rounded-xl text-xs font-bold hover:bg-[#2c1c19] flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 shrink-0"
            >
              <Receipt21 className="w-4 h-4 text-[#C5A059]" /> View / Print Bill
            </button>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 bg-secondary/5">
            <div className="space-y-6">
              
              {order && (order.status === 'DECORATING' || order.status === 'READY_FOR_PICKUP' || order.status === 'PENDING_ASSIGNMENT' || order.status === 'COMPLETED') && (
                <QualityControlChecklist 
                  orderId={order.id} 
                  existingQC={order.qualityChecklist as any} 
                  onSuccess={() => refetch()}
                />
              )}

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Payment Information
                </h3>
                <PaymentDetailsViewer payments={order?.ledgerEntries || []} />
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  Order Timeline
                </h3>
                <OrderTimelineViewer orderId={orderId} />
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
