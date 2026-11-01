import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import { Refresh2, Profile2User, Crown } from "iconsax-react"
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
                className={`p-3 border rounded-xl flex items-center justify-between ${
                  driver.isSelf
                    ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                    : driver.isOverloaded
                    ? 'bg-destructive/5 border-destructive/20'
                    : 'bg-card'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{driver.name}</p>
                    {driver.isSelf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-800 border border-amber-400/40">
                        <Crown className="w-3 h-3" variant="Bold" />
                        Self-Assign
                      </span>
                    )}
                  </div>
                  {driver.phone && (
                    <p className="text-xs text-muted-foreground">{driver.phone}</p>
                  )}
                  {!driver.isSelf && (
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
                  )}
                </div>
                <Button
                  size="sm"
                  variant={driver.isSelf ? "default" : "default"}
                  className={driver.isSelf ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                  onClick={() => handleAssign(driver.driverId)}
                  disabled={isSubmitting}
                >
                  {driver.isSelf ? "Take It" : "Assign"}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
