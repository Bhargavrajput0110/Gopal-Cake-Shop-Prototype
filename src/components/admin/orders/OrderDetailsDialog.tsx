'use client'

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { OrderTimelineViewer } from "./OrderTimelineViewer"
import { PaymentDetailsViewer } from "./PaymentDetailsViewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { QualityControlChecklist } from "@/components/chef/QualityControlChecklist"
import { useQuery } from "@tanstack/react-query"
import { OrdersApiClient } from "@/lib/api/orders.api"

interface OrderDetailsDialogProps {
  orderId: string | null
  isOpen: boolean
  onClose: () => void
}

export function OrderDetailsDialog({ orderId, isOpen, onClose }: OrderDetailsDialogProps) {
  const { data: response, refetch } = useQuery({
    queryKey: ['orderDetails', orderId],
    queryFn: () => orderId ? OrdersApiClient.getOrder(orderId) : Promise.resolve(null),
    enabled: !!orderId
  })

  if (!orderId) return null

  const order = response?.data

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0 border-b">
          <DialogTitle className="text-xl">Order Details: {orderId}</DialogTitle>
          <DialogDescription>
            View the complete lifecycle and history of this order.
          </DialogDescription>
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
              <PaymentDetailsViewer payments={order.payments} />
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
  )
}
