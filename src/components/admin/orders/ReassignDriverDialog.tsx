import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import { Refresh2, Profile2User } from "iconsax-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ReassignDriverDialogProps {
  orderId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReassignDriverDialog({ orderId, isOpen, onClose, onSuccess }: ReassignDriverDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['admin-drivers-workload'],
    queryFn: () => fetchClient<any[]>('/admin/drivers/workload'),
    enabled: isOpen
  })

  const handleAssign = async (driverId: string) => {
    setIsSubmitting(true)
    try {
      await fetchClient('/admin/drivers/assign', {
        method: 'POST',
        body: JSON.stringify({ orderId, driverId })
      })
      onSuccess()
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Profile2User className="w-5 h-5 text-primary" />
            Reassign Delivery Driver
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Refresh2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : drivers?.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No active drivers found.</p>
          ) : (
            drivers?.map((driver) => (
              <div 
                key={driver.driverId} 
                className={`p-3 border rounded-xl flex items-center justify-between ${driver.isOverloaded ? 'bg-destructive/5 border-destructive/20' : 'bg-card'}`}
              >
                <div>
                  <p className="font-bold text-sm">{driver.name}</p>
                  <p className="text-xs text-muted-foreground">{driver.phone}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      Active: {driver.activeCount}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                      Done: {driver.deliveredToday}
                    </span>
                    {driver.lateCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                        Late: {driver.lateCount}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleAssign(driver.driverId)}
                  disabled={isSubmitting}
                >
                  Assign
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
