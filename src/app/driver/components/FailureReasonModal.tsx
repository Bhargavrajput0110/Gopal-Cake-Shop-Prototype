import * as React from 'react'
import { Button } from '@/components/ui/button'
import { CloseSquare, Danger } from "iconsax-react"

const FAILURE_REASONS = [
  { id: 'CUSTOMER_UNAVAILABLE', label: 'Customer Unavailable' },
  { id: 'WRONG_ADDRESS', label: 'Wrong Address / Location' },
  { id: 'CUSTOMER_REFUSED', label: 'Customer Refused Order' },
  { id: 'VEHICLE_ISSUE', label: 'Vehicle Breakdown / Delay' },
  { id: 'OTHER', label: 'Other Reason' }
]

interface FailureReasonModalProps {
  onClose: () => void
  onConfirm: (reason: string, notes: string) => void
}

export function FailureReasonModal({ onClose, onConfirm }: FailureReasonModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<string | null>(null)
  const [notes, setNotes] = React.useState('')

  return (
    <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card w-full max-w-sm rounded-xl border-2 border-destructive shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-destructive/10 flex justify-between items-center text-destructive">
          <div className="flex items-center gap-2">
            <Danger className="w-5 h-5" />
            <h3 className="font-black text-lg">Report Failure</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-destructive/20 rounded-full">
            <CloseSquare className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          <p className="text-sm font-bold text-muted-foreground mb-4">
            Select the reason this delivery could not be completed. The manager will be notified.
          </p>

          <div className="space-y-2">
            {FAILURE_REASONS.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReason(r.id)}
                className={`w-full text-left p-4 rounded-xl border-2 font-bold transition-colors ${
                  selectedReason === r.id 
                    ? 'border-destructive bg-destructive/10 text-destructive' 
                    : 'border-border hover:border-destructive/30'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {selectedReason === 'OTHER' && (
            <div className="mt-4 animate-in slide-in-from-top-2">
              <label className="text-sm font-bold block mb-2 text-destructive">Please Specify (Required)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-muted border-none rounded-xl p-3 resize-none focus:ring-2 ring-destructive"
                rows={3}
                placeholder="Explain what happened..."
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/10">
          <Button 
            variant="destructive"
            className="w-full h-14 text-lg font-black" 
            disabled={!selectedReason || (selectedReason === 'OTHER' && notes.trim() === '')}
            onClick={() => onConfirm(selectedReason!, notes)}
          >
            Mark as Failed
          </Button>
        </div>
      </div>
    </div>
  )
}
