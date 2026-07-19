import * as React from "react"
import { MoneyArchive, Card, Mobile, Calendar2, Clock, Location, User, Tag, Warning2 } from "iconsax-react"
import { useCart } from "@/context/CartContext"
import { OrdersApiClient } from "@/lib/api/orders.api"

interface PaymentDialogProps {
  onClose: () => void
  onSuccess: (orderId: string) => void
}

export function PaymentDialog({ onClose, onSuccess }: PaymentDialogProps) {
  const { items: cart, subtotal, clearCart } = useCart()
  
  // Customer & Delivery State
  const [orderType, setOrderType] = React.useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [customer, setCustomer] = React.useState({ name: '', phone: '', email: '' })
  const [address, setAddress] = React.useState({ house: '', street: '', area: '', city: 'Vadodara', pin: '', landmark: '' })
  
  // Fulfillment Time
  const now = new Date()
  now.setHours(now.getHours() + 1)
  const todayStr = new Date().toISOString().split('T')[0]
  const [targetDate, setTargetDate] = React.useState<string>(now.toISOString().split('T')[0])
  const [targetTime, setTargetTime] = React.useState<string>(now.toTimeString().slice(0, 5))
  
  // Store Overrides
  const [priority, setPriority] = React.useState<'NORMAL' | 'HIGH' | 'VIP'>('NORMAL')
  const [discountType, setDiscountType] = React.useState<'NONE' | 'PERCENT' | 'FLAT'>('NONE')
  const [discountValue, setDiscountValue] = React.useState<string>('')

  // Payment
  const [method, setMethod] = React.useState<'CASH' | 'CARD' | 'UPI'>('CASH')
  const [paymentType, setPaymentType] = React.useState<'FULL' | 'PARTIAL'>('FULL')
  const [advanceAmount, setAdvanceAmount] = React.useState<string>('')
  
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Math
  const discountAmt = discountType === 'PERCENT' 
    ? (subtotal * (parseFloat(discountValue) || 0)) / 100 
    : discountType === 'FLAT' 
      ? (parseFloat(discountValue) || 0) 
      : 0
      
  const total = Math.max(0, subtotal - discountAmt)
  const amountToPay = paymentType === 'FULL' ? total : (parseFloat(advanceAmount) || 0)
  const balanceDue = total - amountToPay

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])


  const handleCheckout = async () => {
    setIsSubmitting(true)
    
    try {
      const targetDateISO = new Date(`${targetDate}T${targetTime}:00`).toISOString()
      
      const payload = {
        customerId: customer.name ? customer.name : 'walk-in',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          weight: item.weight || 1,
          flavor: item.flavor,
          messageOnCake: item.messageOnCake,
          frontendPrice: item.price
        })),
        payments: [
          {
            method,
            amount: amountToPay
          }
        ],
        paymentType,
        targetDate: targetDateISO,
        isPriority: priority !== 'NORMAL',
        overrideDiscount: discountAmt > 0 ? discountAmt : undefined,
      }

      const res = await fetch('/api/v1/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Checkout failed')
      }

      clearCart()
      onSuccess(data.orderId)
    } catch (err: any) {
      console.error('POS Checkout Error:', err)
      alert(`Checkout Error: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] border border-border/50 shadow-[0_32px_64px_-12px_rgba(74,59,53,0.15)] overflow-hidden flex flex-col h-full max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-border/40 bg-[#FCF9F2] flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-sans font-bold text-primary tracking-[0.3em] uppercase block mb-1">POS Checkout</span>
            <h2 className="text-3xl font-black font-serif text-foreground leading-tight">Complete Order</h2>
          </div>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full bg-white text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/10 transition-colors shadow-sm">
            Cancel (Esc)
          </button>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* LEFT COLUMN: Customer & Order Details */}
            <div className="space-y-10">
              
              {/* Type & Date */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-border/40 pb-4">
                  <button onClick={() => setOrderType('PICKUP')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${orderType === 'PICKUP' ? 'bg-foreground text-background' : 'bg-secondary/5 text-foreground/50 hover:bg-secondary/10'}`}>Store Pickup</button>
                  <button onClick={() => setOrderType('DELIVERY')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${orderType === 'DELIVERY' ? 'bg-foreground text-background' : 'bg-secondary/5 text-foreground/50 hover:bg-secondary/10'}`}>Home Delivery</button>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1"><Calendar2 className="w-3 h-3"/> Target Date</label>
                    <input type="date" min={todayStr} value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-secondary/5 border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-3 py-3 font-serif text-lg transition-colors rounded-t-lg" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> Target Time</label>
                    <input type="time" value={targetTime} onChange={e => setTargetTime(e.target.value)} className="w-full bg-secondary/5 border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-3 py-3 font-serif text-lg transition-colors rounded-t-lg" />
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-6">
                <h3 className="font-serif text-xl font-bold border-b border-border/40 pb-2 flex items-center gap-2"><User className="w-5 h-5 text-primary"/> Customer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Full Name</label>
                    <input type="text" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif transition-colors placeholder:text-foreground/20" placeholder="e.g. Rahul Patel" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Phone</label>
                    <input type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif transition-colors placeholder:text-foreground/20" placeholder="+91 9876543210" />
                  </div>
                </div>
              </div>

              {/* Address (If Delivery) */}
              {orderType === 'DELIVERY' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                  <h3 className="font-serif text-xl font-bold border-b border-border/40 pb-2 flex items-center gap-2"><Location className="w-5 h-5 text-primary"/> Delivery Address</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">House / Flat No.</label>
                    <input type="text" value={address.house} onChange={e => setAddress({...address, house: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif transition-colors" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Street / Society</label>
                      <input type="text" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Area</label>
                      <input type="text" value={address.area} onChange={e => setAddress({...address, area: e.target.value})} className="w-full bg-transparent border-0 border-b-2 border-border/40 focus:border-primary focus:ring-0 px-0 py-2 text-lg font-serif transition-colors" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Overrides, Discounts & Payment */}
            <div className="bg-secondary/5 rounded-[2rem] p-6 md:p-8 border border-secondary/10 flex flex-col gap-8">
              
              {/* Internal Overrides */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-2"><Warning2 className="w-3 h-3"/> POS Overrides</h3>
                
                {/* Priority */}
                <div className="flex bg-white rounded-full p-1 border border-border/40 shadow-sm">
                  {['NORMAL', 'HIGH', 'VIP'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setPriority(p as any)} 
                      className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-full transition-all ${priority === p ? 'bg-foreground text-background' : 'text-foreground/50 hover:bg-secondary/10'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Discount */}
                <div className="flex gap-4 items-end bg-white p-4 rounded-2xl border border-border/40 shadow-sm">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest flex items-center gap-1"><Tag className="w-3 h-3"/> Discount</label>
                    <div className="flex gap-2">
                      <button onClick={() => { setDiscountType('NONE'); setDiscountValue(''); }} className={`px-3 py-1.5 text-[9px] font-bold rounded-lg ${discountType === 'NONE' ? 'bg-primary text-primary-foreground' : 'bg-secondary/10 text-foreground/70'}`}>NONE</button>
                      <button onClick={() => setDiscountType('PERCENT')} className={`px-3 py-1.5 text-[9px] font-bold rounded-lg ${discountType === 'PERCENT' ? 'bg-primary text-primary-foreground' : 'bg-secondary/10 text-foreground/70'}`}>% OFF</button>
                      <button onClick={() => setDiscountType('FLAT')} className={`px-3 py-1.5 text-[9px] font-bold rounded-lg ${discountType === 'FLAT' ? 'bg-primary text-primary-foreground' : 'bg-secondary/10 text-foreground/70'}`}>₹ OFF</button>
                    </div>
                  </div>
                  {discountType !== 'NONE' && (
                    <div className="w-32 animate-in slide-in-from-right-4 fade-in">
                      <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === 'PERCENT' ? '10' : '500'} className="w-full bg-secondary/5 border-0 border-b-2 border-primary focus:ring-0 px-2 py-1.5 font-serif text-xl text-center rounded-t-lg" />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Split */}
              <div className="space-y-4">
                <div className="flex bg-white rounded-full p-1 border border-border/40 shadow-sm">
                  <button onClick={() => setPaymentType('FULL')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${paymentType === 'FULL' ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:bg-secondary/10'}`}>Full Payment</button>
                  <button onClick={() => setPaymentType('PARTIAL')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${paymentType === 'PARTIAL' ? 'bg-primary text-primary-foreground' : 'text-foreground/50 hover:bg-secondary/10'}`}>Advance Payment</button>
                </div>
                
                {paymentType === 'PARTIAL' && (
                  <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-sm flex items-center justify-between animate-in slide-in-from-top-4 fade-in">
                    <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">Advance Amt:</span>
                    <div className="relative w-40">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-serif text-2xl">₹</span>
                      <input type="number" autoFocus value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-secondary/5 border-0 border-b-2 border-primary focus:ring-0 text-right font-serif text-3xl font-black rounded-t-lg" placeholder="0" />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setMethod('CASH')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'CASH' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-white bg-white hover:bg-secondary/5 text-foreground/50'}`}>
                  <MoneyArchive className="w-6 h-6" /> <span className="font-bold text-[10px] uppercase tracking-widest">Cash</span>
                </button>
                <button onClick={() => setMethod('UPI')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'UPI' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-white bg-white hover:bg-secondary/5 text-foreground/50'}`}>
                  <Mobile className="w-6 h-6" /> <span className="font-bold text-[10px] uppercase tracking-widest">UPI</span>
                </button>
                <button onClick={() => setMethod('CARD')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'CARD' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-white bg-white hover:bg-secondary/5 text-foreground/50'}`}>
                  <Card className="w-6 h-6" /> <span className="font-bold text-[10px] uppercase tracking-widest">Card</span>
                </button>
              </div>

              {/* Math Summary */}
              <div className="mt-auto space-y-3 pt-6 border-t border-border/20">
                <div className="flex justify-between text-sm font-serif"><span className="text-foreground/60">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-sm font-serif text-emerald-600"><span>Discount</span><span>-₹{discountAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between text-2xl font-serif font-black pt-2 border-t border-border/40">
                  <span>Total</span><span>₹{total.toFixed(2)}</span>
                </div>
                {paymentType === 'PARTIAL' && (
                  <div className="flex justify-between text-lg font-serif font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">
                    <span>Balance Due Later</span><span>₹{balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 md:p-8 border-t border-border/40 bg-white flex justify-end gap-4 shrink-0">
          <button onClick={handleCheckout} disabled={isSubmitting || (paymentType === 'PARTIAL' && amountToPay <= 0)} className="w-full md:w-auto px-12 py-4 bg-foreground text-background rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:pointer-events-none">
            {isSubmitting ? 'Processing...' : `Accept ₹${amountToPay.toFixed(2)}`}
          </button>
        </div>

      </div>
    </div>
  )
}
