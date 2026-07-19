import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Camera, CloseSquare, TickSquare } from "iconsax-react"

interface ProofOfDeliveryModalProps {
  onClose: () => void
  onConfirm: (cashCollected: number, notes: string) => void
  expectedAmount: number
  paymentStatus: string
}

export function ProofOfDeliveryModal({ onClose, onConfirm, expectedAmount, paymentStatus }: ProofOfDeliveryModalProps) {
  const [cashCollected, setCashCollected] = React.useState<number>(expectedAmount)
  const [notes, setNotes] = React.useState('')
  const [hasPhoto, setHasPhoto] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setHasPhoto(true)
      // Actual implementation would upload to Cloudinary/Media Engine here.
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card w-full max-w-sm rounded-xl border-2 border-primary shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <h3 className="font-black text-lg">Proof of Delivery</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Photo Capture */}
          <div>
            <label className="text-sm font-bold block mb-2">Delivery Photo (Required)</label>
            <button 
              className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-colors ${hasPhoto ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50 text-muted-foreground'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {hasPhoto ? <TickSquare className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
              <span className="font-bold">{hasPhoto ? 'Photo Attached' : 'Tap to Take Photo'}</span>
            </button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
          </div>

          {/* Payment Collection */}
          {paymentStatus === 'COD' && (
            <div className="bg-warning/10 border-2 border-warning/30 p-4 rounded-xl space-y-2">
              <label className="text-sm font-black text-warning-foreground uppercase tracking-wider block">Collect Cash</label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black">₹</span>
                <input 
                  type="number" 
                  value={cashCollected}
                  onChange={(e) => setCashCollected(Number(e.target.value))}
                  className="w-full bg-transparent text-2xl font-black outline-none border-b-2 border-warning/50 focus:border-warning py-1"
                />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Expected: ₹{expectedAmount}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-bold block mb-2">Delivery Notes (Optional)</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-muted border-none rounded-xl p-3 resize-none focus:ring-2 ring-primary"
              rows={2}
              placeholder="E.g., Left with security guard"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-muted/10">
          <Button 
            className="w-full h-14 text-lg font-black" 
            disabled={!hasPhoto}
            onClick={() => onConfirm(cashCollected, notes)}
          >
            Confirm Delivered
          </Button>
        </div>
      </div>
    </div>
  )
}
