import * as React from 'react'
import { Button } from '@/components/ui/button'
import { OrdersApiClient } from '@/lib/api/orders.api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Refresh2 } from "iconsax-react"

interface TransitionButtonProps {
  orderId: string
  action: string
  label: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  note?: string
}

export function TransitionButton({ orderId, action, label, variant = "default", className = "", note }: TransitionButtonProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => OrdersApiClient.transitionOrder(orderId, action, note),
    onSuccess: () => {
      // Invalidate query to trigger refetch, adhering to "Server-confirmed transitions" rule
      queryClient.invalidateQueries({ queryKey: ['chef-orders'] })
    },
    onError: (err: any) => {
      let msg = err.message || 'Transition failed. Please try again.'
      if (msg.includes('Invalid transition') || msg.includes('Cannot transition')) {
        msg = 'This order has already been processed by another staff member.'
      }
      alert(msg)
    }
  })

  return (
    <Button 
      variant={variant} 
      onClick={() => mutate()} 
      disabled={isPending}
      className={`${className} min-h-[48px] font-bold shadow-sm relative overflow-hidden text-base`}
    >
      {isPending && <Refresh2 className="mr-2 h-5 w-5 animate-spin" />}
      {isPending ? 'Processing...' : label}
    </Button>
  )
}
