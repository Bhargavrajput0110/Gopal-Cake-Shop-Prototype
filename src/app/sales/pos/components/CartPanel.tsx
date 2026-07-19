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
    <div className="flex flex-col h-full bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative">
      
      {/* Decorative Glow */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-black/20 flex items-center justify-between z-10 relative">
        <h2 className="font-display text-xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <Bag className="w-5 h-5 text-emerald-400" variant="Bold" />
          </div>
          Current Order
        </h2>
        <div className="bg-emerald-500/20 text-emerald-400 font-ui text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-500/30">
          {cart.length} items
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 z-10 relative custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Bag className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-editorial italic text-xl">Cart is empty</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.cartItemId} className="flex gap-4 bg-black/40 p-4 rounded-[1.5rem] border border-white/5 shadow-sm group hover:border-white/20 transition-colors">
              <div className="flex-1">
                <p className="font-display font-bold text-lg text-white truncate pr-2">{item.name}</p>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-gray-400 text-sm font-ui tracking-widest font-bold">₹{item.price.toFixed(2)}</p>
                  <p className="text-gray-500 font-ui text-[9px] uppercase tracking-widest font-black">
                    {item.weight}kg {item.flavor ? `• ${item.flavor}` : ''} {item.shape ? `• ${item.shape}` : ''}
                  </p>
                  {item.designName && (
                    <p className="text-emerald-400 font-ui text-[9px] uppercase tracking-widest font-black mt-1">Design: {item.designName}</p>
                  )}
                  <button 
                    onClick={() => setConfigCartItemId(item.cartItemId)}
                    className="text-[10px] font-ui uppercase tracking-widest font-black text-emerald-500 text-left hover:text-emerald-400 mt-2 w-fit transition-colors"
                  >
                    Edit Configuration
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between py-1">
                <p className="font-display font-black text-xl text-white">₹{(item.price * item.quantity).toFixed(2)}</p>
                
                {/* Massive Touch Targets for Increment/Decrement */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg text-white transition-all active:scale-90"
                  >
                    {item.quantity === 1 ? <Trash className="w-5 h-5 text-rose-500" variant="Bold" /> : <Minus className="w-5 h-5" />}
                  </button>
                  <span className="w-8 text-center font-display text-lg font-bold text-white">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                    className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg text-white transition-all active:scale-90"
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
      <div className="p-6 border-t border-white/10 bg-black/40 z-10 relative">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between font-ui text-[11px] uppercase tracking-widest font-black text-gray-400">
            <span>Subtotal</span>
            <span className="text-white">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-ui text-[11px] uppercase tracking-widest font-black text-gray-400">
            <span>Tax (est. 5%)</span>
            <span className="text-white">₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-white/10">
            <span className="font-display text-3xl font-black text-white">Total</span>
            <span className="font-display text-3xl font-black text-emerald-400">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Override UI */}
        <div className="mb-4">
          {!overrideStatus && (
            <button 
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-xl font-ui text-[9px] uppercase tracking-widest font-black transition-colors"
              onClick={() => {
                const amount = prompt("Enter custom discount amount:")
                if (amount === '5000') {
                  alert("Manager Override Required")
                  const reason = prompt("Enter reason for override:")
                  if (reason) {
                    window.localStorage.setItem('overrideStatus', 'Pending Admin Approval')
                    window.location.reload()
                  }
                }
              }}
            >
              Apply Custom Discount
            </button>
          )}
          {overrideStatus === 'Pending Admin Approval' && (
            <div className="text-center font-ui text-[10px] font-black uppercase tracking-widest text-amber-500 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              Pending Admin Approval
            </div>
          )}
          {overrideStatus === 'Approved' && (
            <div className="text-center font-ui text-[10px] font-black uppercase tracking-widest text-emerald-500 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              Discount Applied
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={handleSaveQuote}
            disabled={cart.length === 0 || isSavingQuote}
            className="flex-1 py-5 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white rounded-2xl font-ui text-[10px] uppercase tracking-widest font-black transition-all active:scale-95"
          >
            {isSavingQuote ? 'Saving...' : 'Save Quote'}
          </button>
          <button 
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="flex-[2] py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 rounded-2xl font-ui text-[11px] uppercase tracking-widest font-black shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
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
