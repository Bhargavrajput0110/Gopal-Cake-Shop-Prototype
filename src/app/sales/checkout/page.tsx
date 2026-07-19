'use client'

import * as React from "react"
import { useState } from "react"
import { CakeBuilder, CakeBuilderData } from "@/components/shared/CakeBuilder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchNormal1, Add, Card, MoneyArchive, Mobile } from "iconsax-react"
import { BackButton } from "@/components/ui/BackButton"

export default function SalesCheckoutPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isCustomerResolved, setIsCustomerResolved] = useState(false)
  const [cakeData, setCakeData] = useState<CakeBuilderData | null>(null)
  
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'UPI'|'CARD'|'RAZORPAY'>('CASH')
  const [paymentType, setPaymentType] = useState<'FULL'|'ADVANCE'>('FULL')
  const [deliveryType, setDeliveryType] = useState<'DELIVERY'|'PICKUP'>('PICKUP')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateOrder = async () => {
    if (!cakeData || !phone) {
      alert("Please enter customer phone and cake details")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/v1/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          customer: { phone, name, email },
          items: [cakeData],
          paymentMethod,
          paymentType,
          branchId: 'clx123abc0000', // Mock branch ID. In a real app, from user session
          deliveryType,
          deliveryDate: new Date().toISOString(), // Mock immediate
        })
      })

      const json = await res.json()
      if (json.success) {
        alert(`Order Created Successfully! Order Number: ${json.orderNumber}`)
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
          <BackButton fallback="/sales/pos" label="Back to POS" variant="outline" size="sm" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Sales Checkout</h1>
        <p className="text-muted-foreground">Create orders on behalf of customers. Rules are strictly enforced.</p>
      </div>

      {/* STEP 1: Customer */}
      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span> 
          Customer Identity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <div className="relative">
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="e.g. 9876543210" 
                maxLength={10}
              />
              <SearchNormal1 className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Customer Name (Optional)</Label>
            <Input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe" 
            />
          </div>
          <div className="space-y-2">
            <Label>Email (Optional)</Label>
            <Input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. john@example.com" 
            />
          </div>
        </div>
      </div>

      {/* STEP 2: Cake Builder */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span> 
          Order Items
        </h2>
        <CakeBuilder 
          allowMediaUpload={true} 
          onChange={setCakeData}
        />
      </div>

      {/* STEP 3: Payment & Fulfillment */}
      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span> 
          Fulfillment & Payment
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label>Fulfillment Method</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 border rounded-md p-4 flex-1 cursor-pointer hover:bg-secondary/20">
                <input type="radio" name="deliveryType" checked={deliveryType === 'PICKUP'} onChange={() => setDeliveryType('PICKUP')} />
                <span className="font-medium">Store Pickup</span>
              </label>
              <label className="flex items-center gap-2 border rounded-md p-4 flex-1 cursor-pointer hover:bg-secondary/20">
                <input type="radio" name="deliveryType" checked={deliveryType === 'DELIVERY'} onChange={() => setDeliveryType('DELIVERY')} />
                <span className="font-medium">Delivery</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer ${paymentMethod === 'CASH' ? 'bg-primary/10 border-primary' : 'hover:bg-secondary/20'}`}>
                <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'CASH'} onChange={() => setPaymentMethod('CASH')} />
                <MoneyArchive className="w-4 h-4" /> <span className="text-sm font-medium">Cash</span>
              </label>
              <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer ${paymentMethod === 'UPI' ? 'bg-primary/10 border-primary' : 'hover:bg-secondary/20'}`}>
                <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} />
                <Mobile className="w-4 h-4" /> <span className="text-sm font-medium">UPI QR</span>
              </label>
              <label className={`flex items-center gap-2 border rounded-md p-3 cursor-pointer ${paymentMethod === 'RAZORPAY' ? 'bg-primary/10 border-primary' : 'hover:bg-secondary/20'}`}>
                <input type="radio" name="paymentMethod" className="hidden" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} />
                <Card className="w-4 h-4" /> <span className="text-sm font-medium">Payment Link</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button size="lg" className="w-full md:w-auto px-12" onClick={handleCreateOrder} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Order'}
        </Button>
      </div>

    </div>
  )
}
