'use client'

import * as React from "react"
import { useState } from "react"
import { CakeBuilder, CakeBuilderData } from "@/components/shared/CakeBuilder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchNormal1, Add, Card, MoneyArchive, ShieldCross } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"

export default function AdminCheckoutPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cakeData, setCakeData] = useState<CakeBuilderData | null>(null)
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'UPI'|'CARD'|'RAZORPAY'|'MANUAL'>('MANUAL')
  const [paymentType, setPaymentType] = useState<'FULL'|'ADVANCE'>('FULL')
  const [deliveryType, setDeliveryType] = useState<'DELIVERY'|'PICKUP'>('PICKUP')

  // Admin Overrides
  const [overridePrice, setOverridePrice] = useState<number | undefined>(undefined)
  const [overrideDeliveryCharge, setOverrideDeliveryCharge] = useState<number | undefined>(undefined)
  const [isPriority, setIsPriority] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [branchId, setBranchId] = useState('uma-branch-id') // Default to Uma Branch

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateOrder = async () => {
    if (!cakeData || !phone) {
      alert("Please enter customer phone and cake details")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        idempotencyKey: crypto.randomUUID(),
        customer: { phone, name, email },
        items: [{
          ...cakeData,
          overridePrice: overridePrice ? Number(overridePrice) : undefined
        }],
        paymentMethod,
        paymentType,
        branchId, // Uses the selected branch ID

        deliveryType,
        deliveryDate: new Date().toISOString(),
        isPriority,
        internalNotes,
      }

      if (overrideDeliveryCharge !== undefined) {
        payload.overrideDeliveryCharge = Number(overrideDeliveryCharge)
      }

      const res = await fetch('/api/v1/admin/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (json.success) {
        alert(`Admin Order Created Successfully! Order Number: ${json.orderNumber}`)
        window.location.reload()
      } else {
        alert(json.error || 'Failed to create order')
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <div className="mb-4">
          <BackButton fallback="/admin/orders" label="Back to Orders" variant="outline" size="sm" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-destructive flex items-center gap-2">
          <ShieldCross className="w-8 h-8" />
          Admin Checkout (Omni-Channel Override)
        </h1>
        <p className="text-muted-foreground">Bypass standard pricing, force order creation, and mark as priority.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* STEP 1: Customer */}
          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold">Customer Identity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 9876543210" maxLength={10} />
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>
          </div>

          {/* STEP 2: Cake Builder */}
          <CakeBuilder allowMediaUpload={true} onChange={setCakeData} />
        </div>

        <div className="space-y-6">
          {/* Admin Overrides Panel */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-destructive flex items-center gap-2">
              <ShieldCross className="w-5 h-5" />
              Admin Overrides
            </h2>
            
            <div className="space-y-2">
              <Label className="text-destructive font-bold">Override Unit Price (₹)</Label>
              <Input 
                type="number" 
                placeholder="Standard Pricing" 
                value={overridePrice || ''} 
                onChange={e => setOverridePrice(e.target.value ? Number(e.target.value) : undefined)} 
                className="border-destructive/50 focus-visible:ring-destructive"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-destructive font-bold">Override Delivery (₹)</Label>
              <Input 
                type="number" 
                placeholder="Standard Logic" 
                value={overrideDeliveryCharge || ''} 
                onChange={e => setOverrideDeliveryCharge(e.target.value ? Number(e.target.value) : undefined)} 
                className="border-destructive/50 focus-visible:ring-destructive"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="priority" 
                checked={isPriority} 
                onChange={e => setIsPriority(e.target.checked)} 
                className="w-4 h-4 text-destructive focus:ring-destructive rounded"
              />
              <Label htmlFor="priority" className="text-destructive font-bold cursor-pointer">Mark as High Priority</Label>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
             <h2 className="text-lg font-bold">Internal / Fulfillment</h2>
              <div className="space-y-2">
                <Label>Assigned Branch</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                >
                  <option value="uma-branch-id">Uma Branch (Default)</option>
                  <option value="khanderao-branch-id">Khanderao Branch</option>
                  <option value="varsiya-branch-id">Varsiya Branch</option>
                  <option value="ellora-branch-id">Ellora Park Branch</option>
                </select>
              </div>

              <div className="space-y-2">
               <Label>Payment Status</Label>
               <select 
                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                 value={paymentMethod}
                 onChange={e => setPaymentMethod(e.target.value as any)}
               >
                 <option value="MANUAL">Trusted Manual (Override)</option>
                 <option value="CASH">Cash Received</option>
                 <option value="UPI">UPI Confirmed</option>
               </select>
             </div>
             
             <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea 
                  value={internalNotes} 
                  onChange={e => setInternalNotes(e.target.value)} 
                  placeholder="Notes not visible to customer" 
                  rows={4}
                />
             </div>
          </div>

          <Button size="lg" variant="destructive" className="w-full" onClick={handleCreateOrder} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Force Create Order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
