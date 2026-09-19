import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Camera, CloseSquare, TickSquare, Mobile, Money } from "iconsax-react"

interface ProofOfDeliveryModalProps {
  onClose: () => void
  onConfirm: (cashCollected: number, notes: string, paymentMethod?: 'CASH' | 'UPI') => void
  expectedAmount: number
  paymentStatus: string
}

export function ProofOfDeliveryModal({ onClose, onConfirm, expectedAmount, paymentStatus }: ProofOfDeliveryModalProps) {
  const isCod = expectedAmount > 0 || paymentStatus === 'COD'
  const [paymentMode, setPaymentMode] = React.useState<'CASH' | 'UPI'>('UPI')
  const [cashCollected, setCashCollected] = React.useState<number>(expectedAmount)
  const [notes, setNotes] = React.useState('')
  const [hasPhoto, setHasPhoto] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasPhoto(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card w-full max-w-sm rounded-2xl border-2 border-primary shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 shrink-0"
              title="Go back to tasks"
            >
              ← Back
            </button>
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-foreground leading-tight">Proof of Delivery</h3>
              <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Complete Task</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-full shrink-0" title="Close">
            <CloseSquare className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Payment Collection Toggle (If Pending Balance > 0 or COD) */}
          {isCod && (
            <div className="bg-amber-50/80 border-2 border-amber-200 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Collect Payment</span>
                <span className="text-xs font-black text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                  ₹{expectedAmount} DUE
                </span>
              </div>

              {/* Mode Selector */}
              <div className="flex gap-2 p-1 bg-amber-100/60 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMode('UPI')}
                  className={`flex-1 py-2 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'UPI' ? 'bg-sky-600 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  <Mobile className="w-4 h-4" /> UPI QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('CASH')}
                  className={`flex-1 py-2 font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    paymentMode === 'CASH' ? 'bg-emerald-600 text-white shadow-sm' : 'text-amber-900 hover:bg-amber-200/50'
                  }`}
                >
                  <Money className="w-4 h-4" /> Cash Collection
                </button>
              </div>

              {/* UPI QR Display */}
              {paymentMode === 'UPI' ? (
                <div className="bg-white p-3 rounded-xl border border-sky-100 flex flex-col items-center text-center space-y-2 shadow-sm">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-sky-900">
                    Scan Paytm UPI QR (GOPAL BAKERY)
                  </span>
                  <div className="w-36 h-36 bg-white p-1 rounded-xl border-2 border-sky-200 shadow-inner">
                    <img 
                      src="/images/gopal_bakery_upi_qr.jpg" 
                      alt="Paytm UPI QR Code" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-[9px] font-bold text-sky-800 tracking-wide">
                    UPI ID: <span className="font-mono font-black">paytmqr69rnay@ptys</span> | 9712632132
                  </div>
                </div>
              ) : (
                /* Cash Input */
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Cash Received (₹)</label>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-amber-300">
                    <span className="text-xl font-black text-amber-900">₹</span>
                    <input 
                      type="number" 
                      value={cashCollected}
                      onChange={(e) => setCashCollected(Number(e.target.value))}
                      className="w-full bg-transparent text-xl font-black outline-none text-amber-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photo Capture */}
          <div>
            <label className="text-xs font-bold block mb-2 text-foreground">Delivery Photo (Required)</label>
            <button 
              type="button"
              className={`w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                hasPhoto ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border hover:border-primary/50 text-muted-foreground'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {hasPhoto ? <TickSquare className="w-7 h-7 text-emerald-600" /> : <Camera className="w-7 h-7" />}
              <span className="font-bold text-xs">{hasPhoto ? 'Photo Attached ✅' : 'Tap to Take Photo'}</span>
            </button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold block mb-1 text-foreground">Delivery Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-muted/50 border border-border/60 rounded-xl p-3 text-xs resize-none focus:ring-2 ring-primary outline-none"
              rows={2}
              placeholder="E.g., Delivered to customer at front door"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-muted/10 flex gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95"
          >
            Cancel
          </button>
          <Button 
            className="flex-1 h-12 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg disabled:opacity-50" 
            disabled={!hasPhoto}
            onClick={() => onConfirm(paymentMode === 'CASH' ? cashCollected : expectedAmount, notes, paymentMode)}
          >
            Confirm & Complete
          </Button>
        </div>
      </div>
    </div>
  )
}
