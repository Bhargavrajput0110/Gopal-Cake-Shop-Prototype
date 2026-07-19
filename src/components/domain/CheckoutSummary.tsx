import React from 'react'

export type CheckoutSummaryProps = {
  name: string
  house: string
  area: string
  city: string
  paymentMethod: string
  subtotal: number | string
}

export function CheckoutSummary({
  name, house, area, city, paymentMethod, subtotal
}: CheckoutSummaryProps) {
  return (
    <div className="space-y-4 mb-6" data-testid="checkout-summary">
      <div className="p-4 bg-muted/20 rounded-xl border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deliver to:</span>
          <span className="font-bold">{name || '-'}</span>
        </div>
        <p className="text-sm font-medium">
          {[house, area, city].filter(Boolean).join(', ') || '-'}
        </p>
      </div>
      
      <div className="p-4 bg-muted/20 rounded-xl border space-y-2">
         <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment:</span>
          <span className="font-bold">{paymentMethod}</span>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-xl">
          <span className="font-bold text-muted-foreground">Total to Pay</span>
          <span className="font-black text-primary">₹{subtotal}</span>
        </div>
      </div>
    </div>
  )
}
