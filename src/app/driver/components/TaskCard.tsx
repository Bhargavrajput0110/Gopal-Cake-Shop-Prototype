import * as React from 'react'
import { DriverOrderDTO } from '@/dtos/OrderSchemas'
import { Button } from '@/components/ui/button'
import { Call, Location, ArrowRight, Clock, Shop, User, Box, TickCircle } from "iconsax-react"

interface TaskCardProps {
  task: DriverOrderDTO
  onAction: (action: string, extraData?: any) => void
}

export function TaskCard({ task: item, onAction }: TaskCardProps) {
  const isLate = new Date(item.timeTarget).getTime() < Date.now()
  const isPending = !['DELIVERED', 'FAILED_DELIVERY', 'COMPLETED'].includes(item.status)
  const isCustomerDelivery = item.taskType === 'CUSTOMER_DELIVERY' || !item.taskType // fallback
  const isVendorPickup = item.taskType === 'VENDOR_PICKUP'
  const isBranchTransfer = item.taskType === 'BRANCH_TRANSFER'

  // Format times
  const deliveryTime = new Date(item.timeTarget).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleNavigate = () => {
    const destination = (item.status === 'PICKED_UP' || item.status === 'ON_THE_WAY' || item.status === 'DELIVERING_TO_BRANCH') 
      ? (item.dropoffLocation || item.formattedAddress)
      : (item.pickupLocation || item.formattedAddress)
      
    const encodedAddress = encodeURIComponent(destination || 'Gopal Cake Shop')
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank')
  }

  const handleCall = () => {
    if (item.customerPhone) window.open(`tel:${item.customerPhone}`, '_self')
  }

  // Icons and Titles based on taskType
  let TaskIcon = Box
  let taskTitle = 'Task'
  
  if (isCustomerDelivery) { TaskIcon = User; taskTitle = 'Customer Delivery'; }
  if (isVendorPickup) { TaskIcon = Shop; taskTitle = 'Vendor Pickup'; }
  if (isBranchTransfer) { TaskIcon = ArrowRight; taskTitle = 'Branch Transfer'; }

  // Action Buttons logic mapped to state machine
  const renderActionButtons = () => {
    if (!isPending) return null;

    if (item.status === 'ASSIGNED') {
      return (
        <Button 
          className="h-14 rounded-full w-full font-bold uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => onAction('ACCEPTED')}
        >
          Accept Task
        </Button>
      )
    }
    
    if (item.status === 'ACCEPTED') {
      return (
        <Button 
          className="h-14 rounded-full w-full font-bold uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => onAction('START_TRIP')}
        >
          Start Trip
        </Button>
      )
    }

    if (item.status === 'ON_THE_WAY' || item.status === 'ON_THE_WAY_TO_VENDOR') {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-14 rounded-full flex gap-2 items-center justify-center bg-white shadow-sm transition-all border-secondary/30 text-secondary hover:bg-secondary hover:text-white"
            onClick={handleNavigate}
          >
            <Location className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Navigate</span>
          </Button>
          <Button 
            className="h-14 rounded-full flex gap-2 items-center justify-center bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all"
            onClick={() => onAction('PICKED_UP')}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Mark Picked Up</span>
          </Button>
        </div>
      )
    }

    if (item.status === 'PICKED_UP' || item.status === 'DELIVERING_TO_BRANCH' || item.status === 'OUT_FOR_DELIVERY') {
      return (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {isCustomerDelivery && (
              <Button 
                variant="outline" 
                className="h-14 rounded-full flex gap-2 items-center justify-center border-border/40 bg-white shadow-sm hover:bg-secondary/5 transition-all text-foreground/70"
                onClick={handleCall}
              >
                <Call className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Call</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className={`h-14 rounded-full flex gap-2 items-center justify-center bg-white shadow-sm transition-all border-secondary/30 text-secondary hover:bg-secondary hover:text-white ${!isCustomerDelivery ? 'col-span-2' : ''}`}
              onClick={handleNavigate}
            >
              <Location className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Navigate</span>
            </Button>
          </div>
          <Button 
            className="h-14 rounded-full w-full font-bold uppercase tracking-[0.2em] shadow-md hover:shadow-lg transition-all bg-emerald-500 hover:bg-emerald-600 text-white flex justify-center items-center gap-2"
            onClick={() => onAction('DELIVERED')}
          >
            <TickCircle className="w-5 h-5" /> Delivered
          </Button>
        </div>
      )
    }

    // Fallback if status doesn't match above exactly but is still "pending" (e.g. READY_FOR_PICKUP backwards compatibility)
    return (
        <Button 
          className="h-14 rounded-full w-full font-bold uppercase tracking-[0.2em] shadow-md bg-primary text-primary-foreground"
          onClick={() => onAction('ACCEPTED')}
        >
          Start Flow
        </Button>
    )
  }

  const borderColor = !isPending ? 'border-emerald-200 shadow-[0_8px_32px_0_rgba(16,185,129,0.08)]' :
                      isLate ? 'border-rose-300 shadow-[0_8px_32px_0_rgba(225,29,72,0.1)]' : 'border-white shadow-[0_8px_32px_0_rgba(74,59,53,0.05)] hover:shadow-[0_16px_48px_0_rgba(74,59,53,0.08)]'

  return (
    <div className={`bg-white/80 backdrop-blur-md rounded-[2rem] border transition-all duration-500 overflow-hidden ${borderColor}`}>
      
      {/* Header Banner */}
      <div className="px-6 py-4 flex justify-between items-center bg-[#FCF9F2] border-b border-border/40">
        <div className="flex flex-col">
          <span className="font-serif text-2xl font-black leading-none">{item.orderNumber}</span>
          <span className="text-[10px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1 flex items-center gap-1.5 text-primary">
            <TaskIcon className="w-3.5 h-3.5" /> {taskTitle}
          </span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="font-serif text-xl font-black leading-none flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70"/> {deliveryTime}</span>
          <span className="text-[9px] font-bold opacity-70 uppercase tracking-[0.2em] mt-1 text-foreground/50">DUE TIME</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Status indicator */}
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-foreground/70 bg-secondary/5 px-4 py-2 rounded-xl border border-secondary/10">
          <span>Status</span>
          <span className="text-primary">{item.status.replace(/_/g, ' ')}</span>
        </div>

        {/* Routing Information */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-4">
             <div className="w-2 h-2 rounded-full bg-secondary mt-2 shrink-0"></div>
             <div>
                <span className="text-[9px] uppercase tracking-widest text-foreground/50 font-bold">Pickup From</span>
                <p className="font-serif font-bold text-lg leading-tight">{item.pickupLocation}</p>
             </div>
          </div>
          <div className="pl-1"><div className="w-0.5 h-4 bg-border/60 ml-0.5"></div></div>
          <div className="flex items-start gap-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
             <div>
                <span className="text-[9px] uppercase tracking-widest text-foreground/50 font-bold">Dropoff To</span>
                <p className="font-serif font-bold text-lg leading-tight">{item.dropoffLocation}</p>
                {isCustomerDelivery && item.customerName && (
                  <p className="text-sm font-bold text-foreground/70 mt-1">{item.customerName}</p>
                )}
             </div>
          </div>
        </div>

        {/* Financials / Cash Collection */}
        {!isVendorPickup && !isBranchTransfer && item.totalAmount !== undefined && (
          <div className={`px-4 py-3 rounded-xl border flex justify-between items-center shadow-sm ${item.totalAmount > item.paidAmount ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${item.totalAmount > item.paidAmount ? 'text-rose-600' : 'text-emerald-600'}`}>Payment</span>
            {item.totalAmount > item.paidAmount ? (
              <span className="text-[12px] font-black text-rose-700 bg-rose-200/50 px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                COLLECT ₹{item.totalAmount - item.paidAmount}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] bg-emerald-100/50 px-2 py-1 rounded">
                PAID ONLINE
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 shadow-sm">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest block mb-1">Notes</span>
            <p className="font-serif italic text-amber-900/80">{item.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2">
          {renderActionButtons()}
        </div>

      </div>
    </div>
  )
}
