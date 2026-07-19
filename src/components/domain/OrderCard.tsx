import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from "iconsax-react"

export type OrderCardProps = {
  orderId: string
  status: string
  customerName: string
  items: { name: string; quantity: number; weight?: number }[]
  timeTarget: string
  createdAt: string
  grandTotal: number
  isSurprise?: boolean
  priorityLevel?: 'normal' | 'high'
  onAccept?: () => void
  onReady?: () => void
  isLoading?: boolean
}

export function OrderCard({
  orderId, status, customerName, items, timeTarget, createdAt, grandTotal,
  isSurprise, priorityLevel, onAccept, onReady, isLoading
}: OrderCardProps) {
  
  if (isLoading) {
    return (
      <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm opacity-50 flex items-center justify-center h-40" data-testid="order-card-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border p-3.5 rounded-xl shadow-sm hover:border-primary/30 transition-all" data-testid={`order-card-${orderId}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-bold text-foreground text-xs">{orderId}</span>
          {isSurprise && <Badge variant="secondary" className="ml-1.5 text-[9px]">Surprise</Badge>}
          {priorityLevel === 'high' && <Badge variant="destructive" className="ml-1.5 text-[9px]">Urgent</Badge>}
        </div>
        <Badge variant={status === 'NEW' ? 'info' : 'secondary'}>{status}</Badge>
      </div>
      
      <p className="font-semibold text-sm text-foreground truncate">{customerName}</p>
      <p className="text-xs text-muted-foreground truncate mb-3">
        {items.map(i => `${i.name}${i.weight ? ` (${i.weight})` : ''}`).join(', ')}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1 font-bold text-foreground">
          <Clock className="w-3 h-3" /> {timeTarget}
        </div>
        <span className="font-black text-sm text-primary">₹{grandTotal.toFixed(0)}</span>
      </div>

      <div className="flex gap-2 border-t border-border/50 pt-3">
        {status === 'NEW' && onAccept && (
          <button 
            onClick={onAccept}
            className="flex-1 bg-primary text-primary-foreground text-xs font-bold py-1.5 rounded"
            aria-label="Accept Order"
          >
            Accept
          </button>
        )}
        {status === 'making' && onReady && (
          <button 
            onClick={onReady}
            className="flex-1 bg-success text-success-foreground text-xs font-bold py-1.5 rounded"
            aria-label="Mark Ready"
          >
            Ready
          </button>
        )}
      </div>
    </div>
  )
}
