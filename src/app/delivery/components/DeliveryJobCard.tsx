import * as React from 'react'
import { DriverOrderDTO } from '@/dtos/OrderSchemas'
import { DriverTransitionButton } from './DriverTransitionButton'
import { Call, Message, Location, Clock, Danger, ArrowDown2, TickCircle, Map1, Mobile, MoneyArchive } from "iconsax-react"
import { useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import CloudinaryUploader from "@/components/ui/CloudinaryUploader"

import { formatTime, formatDate, formatDayLabel } from '@/lib/formatTime'
import { toBranchShortName } from '@/lib/branches'

interface DeliveryJobCardProps {
  order: DriverOrderDTO
  isActiveRoute?: boolean
}

const FAILURE_REASONS = [
  'Customer unavailable',
  'Wrong address',
  'Customer refused delivery',
  'Order damaged in transit',
  'Other',
]

export function DeliveryJobCard({ order, isActiveRoute = false }: DeliveryJobCardProps) {
  const [now, setNow] = React.useState(new Date())
  const [showFailForm, setShowFailForm] = React.useState(false)
  const [failReason, setFailReason] = React.useState(FAILURE_REASONS[0])
  const [isFailing, setIsFailing] = React.useState(false)
  
  const queryClient = useQueryClient()
  
  const balanceDue = order.pendingBalance || 0
  const [cashCollected, setCashCollected] = React.useState(balanceDue === 0)
  const [isCollecting, setIsCollecting] = React.useState(false)
  const [showCashScreen, setShowCashScreen] = React.useState(false)
  const [paymentMode, setPaymentMode] = React.useState<'CASH' | 'UPI'>('UPI')
  const [proofUrl, setProofUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const pickedUpAt = order.pickedUpAt ? new Date(order.pickedUpAt) : null
  const targetDate = new Date(order.timeTarget)
  
  let elapsedMin = 0
  if (pickedUpAt) {
    elapsedMin = Math.floor((now.getTime() - pickedUpAt.getTime()) / 60000)
  }

  const windowStart = new Date(targetDate.getTime() - 30 * 60000)
  const timeWindow = `${windowStart.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${targetDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`

  // Status Colors
  let statusBg = "bg-emerald-500"
  let statusText = "ON TIME"
  if (now > targetDate) {
    statusBg = "bg-rose-600"
    statusText = "LATE"
  } else if (now.getTime() + 15 * 60000 > targetDate.getTime()) {
    statusBg = "bg-amber-500"
    statusText = "AT RISK"
  }

  const handleFailDelivery = async () => {
    setIsFailing(true)
    try {
      await fetch(`/api/v1/orders/${order.id}/actions/fail-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: failReason })
      })
      await queryClient.invalidateQueries({ queryKey: ['driver-orders'] })
      setShowFailForm(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsFailing(false)
    }
  }

  // Payment Collection Overlay State (Cash / UPI)
  if (showCashScreen && !cashCollected) {
    return (
      <div className="bg-white border-4 border-sky-500 rounded-3xl shadow-xl overflow-hidden flex flex-col p-6 animate-in slide-in-from-bottom-4 space-y-4">
        
        {/* Toggle Mode */}
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          <button
            onClick={() => setPaymentMode('UPI')}
            className={`flex-1 py-3 font-ui text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${paymentMode === 'UPI' ? 'bg-sky-600 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Mobile className="w-4 h-4" /> UPI QR Scanner
          </button>
          <button
            onClick={() => setPaymentMode('CASH')}
            className={`flex-1 py-3 font-ui text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${paymentMode === 'CASH' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <MoneyArchive className="w-4 h-4" /> Cash
          </button>
        </div>

        {paymentMode === 'UPI' ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3 bg-sky-50/60 p-4 rounded-2xl border-2 border-sky-200">
            <div className="flex items-center justify-between w-full px-2">
              <span className="font-ui text-[10px] font-black uppercase tracking-widest text-sky-800">Scan Paytm UPI QR</span>
              <span className="font-ui text-[9px] font-black text-sky-900 bg-sky-200 px-2 py-0.5 rounded-full">GOPAL BAKERY</span>
            </div>
            
            <div className="w-52 h-64 relative rounded-xl overflow-hidden border-2 border-sky-300 bg-white shadow-md flex items-center justify-center p-1">
              <img 
                src="/images/gopal_bakery_upi_qr.jpg" 
                alt="Paytm UPI QR Code" 
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <p className="font-ui text-[10px] uppercase tracking-widest font-black text-gray-500">Collect Amount</p>
              <p className="font-display font-black text-4xl text-sky-950">₹{balanceDue.toFixed(0)}</p>
            </div>

            <p className="font-mono text-[9px] font-bold text-gray-600 bg-white px-3 py-1 rounded-md border border-sky-200">
              UPI ID: paytmqr69rnay@ptys | 9712632132
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4 bg-amber-50/60 p-4 rounded-2xl border-2 border-amber-200">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <span className="font-display font-black text-4xl">₹</span>
            </div>
            <div>
              <p className="font-ui text-[12px] uppercase tracking-widest font-black text-gray-500 mb-1">COLLECT CASH FROM CUSTOMER</p>
              <p className="font-display font-black text-5xl text-gray-900">₹{balanceDue.toFixed(0)}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3 mt-auto pt-2 border-t border-gray-100">
          <button
            onClick={async () => {
              setIsCollecting(true)
              try {
                await fetchClient(`/orders/${order.id}/payments`, {
                  method: 'POST',
                  body: JSON.stringify({ amount: balanceDue, method: paymentMode })
                })
                setCashCollected(true)
                setShowCashScreen(false)
                queryClient.invalidateQueries({ queryKey: ['driver-orders'] })
              } catch (e) {
                console.error(e)
              } finally {
                setIsCollecting(false)
              }
            }}
            disabled={isCollecting}
            className={`w-full py-5 text-white font-ui text-[12px] uppercase tracking-[0.2em] font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-lg ${paymentMode === 'UPI' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {isCollecting ? 'Recording...' : <><TickCircle className="w-6 h-6" /> Confirm {paymentMode} Received</>}
          </button>
          <button
            onClick={() => setShowCashScreen(false)}
            className="w-full py-3 text-gray-500 font-ui text-[10px] uppercase tracking-[0.2em] font-black rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
            disabled={isCollecting}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-3xl shadow-md overflow-hidden flex flex-col ${isActiveRoute ? 'border-2 border-gray-900 shadow-xl' : 'border border-gray-200'}`}>
      
      {/* SLA Header */}
      {isActiveRoute && order.status !== 'READY_FOR_PICKUP' && (
        <div className={`${statusBg} text-white px-6 py-3 flex justify-between items-center`}>
          <span className="font-ui text-[10px] uppercase tracking-widest font-black">{statusText}</span>
          <span className="font-ui text-[12px] font-black flex items-center gap-1.5">
            📅 {formatDayLabel(order.timeTarget)} ({formatDate(order.timeTarget)}) · <Clock className="w-4 h-4"/> {formatTime(order.timeTarget)}
          </span>
        </div>
      )}

      {/* Inter-Branch Transfer Task Banner */}
      {((order as any).transfers?.length > 0 || (order as any).isTransfer || (order as any).transferFrom) && (
        <div className="bg-amber-600 text-white p-4 border-b-2 border-amber-700 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between font-black text-xs uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              🚚 INTER-BRANCH STORE TRANSFER TASK
            </span>
            <span className="bg-amber-900 text-amber-100 px-2 py-0.5 rounded text-[9px] font-black">
              {(order as any).transfers?.[0]?.status || "TRANSFER IN TRANSIT"}
            </span>
          </div>
          <div className="flex items-center justify-between font-extrabold text-xs mt-1 bg-amber-700/80 p-2.5 rounded-xl border border-amber-500/50">
            <span>Pick Up: {toBranchShortName((order as any).transfers?.[0]?.fromBranchId || (order as any).transferFrom || "Origin Store")} Outlet</span>
            <span className="text-amber-200 text-base">➔</span>
            <span>Deliver To: {toBranchShortName((order as any).transfers?.[0]?.toBranchId || (order as any).transferTo || (order as any).branchId || "Destination Store") } Outlet (Store Pickup)</span>
          </div>
        </div>
      )}

      {/* 1. Customer & Address Block */}
      <div className="p-6 bg-gray-50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-black font-display text-3xl text-gray-900 leading-none mb-1">{order.customer?.name || "Walk-in"}</h3>
            <p className="font-ui text-[10px] uppercase tracking-widest font-black text-gray-500">#{order.orderNumber}</p>
          </div>
          {/* Quick Actions (only if active) */}
          {isActiveRoute && order.customer?.phone && (
            <div className="flex gap-2">
              <a href={`tel:${order.customer.phone}`} className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center active:scale-95 transition-transform border border-emerald-200 shadow-sm">
                <Call className="w-6 h-6" />
              </a>
              <a href={`sms:${order.customer.phone}`} className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center active:scale-95 transition-transform border border-blue-200 shadow-sm">
                <Message className="w-6 h-6" />
              </a>
            </div>
          )}
        </div>

        <div className="flex gap-4 items-start">
          <Location className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
          <p className="font-bold text-gray-700 text-lg leading-snug">
            {(order as any).transfers?.length > 0
              ? `Transfer from ${toBranchShortName((order as any).transfers[0].fromBranchId)} Outlet to ${toBranchShortName((order as any).transfers[0].toBranchId)} Outlet`
              : (order.formattedAddress || "Store Pickup")}
          </p>
        </div>
      </div>

      {/* Giant Navigation Button */}
      {isActiveRoute && order.coordinates && (
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${order.coordinates.lat},${order.coordinates.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center w-full py-4 bg-gray-900 text-white font-ui text-[12px] uppercase tracking-widest font-black transition-all active:bg-gray-800"
        >
          <Map1 className="w-6 h-6 mr-2" />
          Navigate to Customer
        </a>
      )}

      {/* 4. Cake Details (Condensed) */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <ul className="space-y-3">
          {order.items.map(item => (
            <li key={item.id} className="flex gap-3 text-base font-bold bg-gray-50 p-3 rounded-xl border border-gray-100">
              <span className="text-gray-900 font-black">{item.quantity}x</span>
              <div className="flex-1">
                <span className="text-gray-900">{item.productName}</span>
                {item.flavor && <span className="text-gray-500 font-editorial italic block text-sm">{item.flavor}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Notes Alert */}
      {order.notes && (
        <div className="p-4 border-y border-amber-200 bg-amber-50 flex gap-3 items-center">
          <Danger className="w-8 h-8 text-amber-500 shrink-0" />
          <p className="text-sm font-bold text-amber-900 leading-tight uppercase tracking-wide">{order.notes}</p>
        </div>
      )}

      {/* 7. Bottom Action Bar */}
      <div className="p-4 bg-white flex flex-col gap-3">
        {order.status === 'READY_FOR_PICKUP' || order.status === 'PENDING_ASSIGNMENT' ? (
          <DriverTransitionButton orderId={order.id} action="assign-driver" label="CLAIM ROUTE" className="w-full py-5 bg-gray-900 text-white font-ui text-[12px] uppercase tracking-widest font-black rounded-2xl shadow-xl active:scale-95 transition-transform" />
        ) : order.status === 'ASSIGNED_TO_DRIVER' ? (
          <DriverTransitionButton orderId={order.id} action="pick-up" label="MARK PICKED UP" className="w-full py-5 bg-blue-600 text-white font-ui text-[12px] uppercase tracking-widest font-black rounded-2xl shadow-xl active:scale-95 transition-transform" />
        ) : order.status === 'PICKED_UP' || order.status === 'ON_THE_WAY' ? (
          <>
            {balanceDue > 0 && !cashCollected ? (
              <button
                onClick={() => setShowCashScreen(true)}
                className="w-full py-5 bg-amber-500 text-white font-ui text-[12px] uppercase tracking-widest font-black rounded-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                COLLECT ₹{balanceDue.toFixed(0)}
              </button>
            ) : (
              <div className="flex flex-col gap-4 p-4 border border-emerald-100 bg-emerald-50 rounded-2xl">
                {!proofUrl ? (
                  <div className="space-y-3">
                    <p className="font-ui text-xs font-black text-emerald-800 uppercase tracking-widest text-center">Step 1: Upload Proof of Delivery</p>
                    <CloudinaryUploader 
                      onUploadSuccess={(urls) => setProofUrl(urls[0])} 
                      maxFiles={1} 
                      label="Upload Proof Photo" 
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="font-ui text-xs font-black text-emerald-800 uppercase tracking-widest text-center">Step 2: Complete Delivery</p>
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border-2 border-emerald-500">
                      <img src={proofUrl} alt="Delivery Proof" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setProofUrl(null)}
                        className="absolute top-2 right-2 bg-rose-500 text-white p-1 rounded shadow"
                      >
                        Change
                      </button>
                    </div>
                    <DriverTransitionButton 
                      orderId={order.id} 
                      action="deliver" 
                      note={proofUrl}
                      label="CONFIRM DELIVERY" 
                      className="w-full py-5 bg-emerald-600 text-white font-ui text-[12px] uppercase tracking-widest font-black rounded-2xl shadow-xl active:scale-95 transition-transform" 
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Failure Report */}
            {!showFailForm ? (
              <button
                className="py-4 font-ui text-[10px] uppercase tracking-widest font-black text-rose-600 rounded-xl bg-rose-50 active:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowFailForm(true)}
              >
                <ArrowDown2 className="w-4 h-4" /> Report Issue
              </button>
            ) : (
              <div className="border-2 border-rose-200 rounded-2xl p-4 bg-rose-50 space-y-4">
                <p className="font-ui text-[10px] uppercase tracking-widest font-black text-rose-600">Select failure reason:</p>
                <select
                  value={failReason}
                  onChange={e => setFailReason(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border-2 border-rose-300 bg-white text-base font-black focus:outline-none focus:border-rose-500"
                >
                  {FAILURE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowFailForm(false)}
                    className="flex-1 py-4 font-ui text-[10px] uppercase tracking-widest font-black text-gray-500 bg-white border-2 border-gray-200 rounded-xl active:bg-gray-100 transition-colors"
                    disabled={isFailing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFailDelivery}
                    disabled={isFailing}
                    className="flex-1 py-4 font-ui text-[10px] uppercase tracking-widest font-black bg-rose-600 text-white rounded-xl active:bg-rose-700 transition-colors disabled:opacity-60"
                  >
                    {isFailing ? '...' : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
