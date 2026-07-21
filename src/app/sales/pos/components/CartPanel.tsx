import * as React from "react"
import { Trash, Add, Minus, Bag } from "iconsax-react"
import { useCart } from "@/context/CartContext"
import { ItemConfiguratorModal } from "./ItemConfiguratorModal"
import { OrdersApiClient } from "@/lib/api/orders.api"

interface CartPanelProps {
  onCheckout: () => void
  onSuccess?: (orderId: string) => void
}

export function CartPanel({ onCheckout, onSuccess }: CartPanelProps) {
  const { items: cart, customerId, discountCode, subtotal, updateQuantity, removeItem } = useCart()
  const [overrideStatus, setOverrideStatus] = React.useState<string | null>(null)
  const [isSavingQuote, setIsSavingQuote] = React.useState(false)
  const [configCartItemId, setConfigCartItemId] = React.useState<string | null>(null)

  React.useEffect(() => {
    setOverrideStatus(window.localStorage.getItem('overrideStatus'))
  }, [])
  
  const tax = subtotal * 0.05 
  const total = subtotal + tax

  const handleSaveQuote = async () => {
    setIsSavingQuote(true)
    try {
      const payload = {
        customerId: customerId || 'walk-in',
        branchId: 'clx123abc0000',
        type: 'QUOTE' as const,
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          weight: i.weight || 1,
          flavor: i.flavor,
          messageOnCake: i.messageOnCake,
          designId: i.designId,
          designCode: i.designCode,
          designName: i.designName,
          designImageUrl: i.designImageUrl,
          shape: i.shape,
          notes: i.notes,
          boxCount: i.boxCount,
          referenceImages: i.referenceImages,
          frontendPrice: i.price
        })),
        payments: [], 
        paymentType: 'FULL' as const,
        notes: "Generated via POS Quote Mode"
      }
      const res = await OrdersApiClient.checkoutPos(payload)
      if (onSuccess) onSuccess(res.id)
    } catch (err) {
      console.error(err)
      alert("Failed to save quote")
    } finally {
      setIsSavingQuote(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden relative">
      
      {/* Header */}
      <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between z-10 relative">
        <h2 className="font-display text-xl font-black text-foreground flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border shadow-sm">
            <Bag className="w-5 h-5 text-[var(--brand-deep-rose)]" variant="Bold" />
          </div>
          Current Order
        </h2>
        <div className="bg-[var(--brand-deep-rose)]/10 text-[var(--brand-deep-rose)] font-ui text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-[var(--brand-deep-rose)]/20">
          {cart.length} items
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 relative custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Bag className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-editorial italic text-xl">Cart is empty</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.cartItemId} className="flex gap-4 bg-white p-4 rounded-[1.5rem] border border-border shadow-sm group hover:border-[var(--brand-deep-rose)]/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-lg text-foreground truncate pr-2">{item.name}</p>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-muted-foreground text-sm font-ui tracking-widest font-bold">₹{item.price.toFixed(2)}</p>
                  <p className="text-muted-foreground font-ui text-[9px] uppercase tracking-widest font-black truncate">
                    {item.weight}kg {item.flavor ? `• ${item.flavor}` : ''} {item.shape ? `• ${item.shape}` : ''}
                  </p>
                  {item.designName && (
                    <p className="text-[var(--brand-deep-rose)] font-ui text-[9px] uppercase tracking-widest font-black mt-1 truncate">Design: {item.designName}</p>
                  )}
                  <button 
                    onClick={() => setConfigCartItemId(item.cartItemId)}
                    className="text-[10px] font-ui uppercase tracking-widest font-black text-indigo-600 text-left hover:text-indigo-500 mt-2 w-fit transition-colors"
                  >
                    Edit Configuration
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between py-1 shrink-0">
                <p className="font-display font-black text-xl text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                
                {/* Massive Touch Targets for Increment/Decrement */}
                <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg text-foreground transition-all active:scale-90"
                  >
                    {item.quantity === 1 ? <Trash className="w-5 h-5 text-rose-500" variant="Bold" /> : <Minus className="w-5 h-5" />}
                  </button>
                  <span className="w-8 text-center font-display text-lg font-bold text-foreground">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-lg text-foreground transition-all active:scale-90"
                  >
                    <Add className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals & Checkout */}
      <div className="p-6 border-t border-border bg-white z-10 relative shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between font-ui text-[11px] uppercase tracking-widest font-black text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-ui text-[11px] uppercase tracking-widest font-black text-muted-foreground">
            <span>Tax (est. 5%)</span>
            <span className="text-foreground">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-border">
            <span className="font-display text-3xl font-black text-foreground">Total</span>
            <span className="font-display text-3xl font-black text-[var(--brand-deep-rose)]">₹{total.toFixed(2)}</span>
          </div>
        </div>



        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleSaveQuote}
            disabled={cart.length === 0 || isSavingQuote}
            className="flex-1 py-5 bg-white hover:bg-muted border border-border text-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-ui text-[10px] uppercase tracking-widest font-black transition-all active:scale-95"
          >
            {isSavingQuote ? 'Saving...' : 'Save Quote'}
          </button>
          <button 
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="flex-[2] py-5 bg-[var(--brand-deep-rose)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-ui text-[11px] uppercase tracking-widest font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
      
      {/* Modals */}
      {configCartItemId && (
        <ItemConfiguratorModal 
          cartItemId={configCartItemId} 
          onClose={() => setConfigCartItemId(null)} 
        />
      )}
    </div>
  )
}
