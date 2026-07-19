import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Refresh2 } from "iconsax-react"
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { OrdersApiClient } from '@/lib/api/orders.api'

interface DriverTransitionButtonProps {
  orderId: string
  action: string
  label: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  note?: string
  reasonCode?: string
  onSuccessCallback?: () => void
}

export function DriverTransitionButton({ 
  orderId, action, label, variant = "default", className = "", note, reasonCode, onSuccessCallback 
}: DriverTransitionButtonProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => OrdersApiClient.transitionOrder(orderId, action, note),
    onSuccess: () => {
      // Refresh driver orders
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] })
      if (onSuccessCallback) onSuccessCallback()
    },
    onError: (err: any) => {
      let msg = err.message || 'Action failed. Please try again.'
      if (msg.includes('Invalid transition') || msg.includes('Cannot transition')) {
        msg = 'This order has already been updated by someone else.'
      }
      alert(msg)
    }
  })

  return (
    <Button 
      variant={variant} 
      onClick={() => mutate()} 
      disabled={isPending}
      className={`${className} min-h-[60px] text-lg font-black shadow-sm relative overflow-hidden`}
    >
      {isPending && <Refresh2 className="mr-2 h-6 w-6 animate-spin" />}
      {isPending ? 'Working...' : label}
    </Button>
  )
}
