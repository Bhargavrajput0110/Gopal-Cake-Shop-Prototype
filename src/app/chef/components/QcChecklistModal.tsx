import * as React from "react"
import { ChefProductionItemDTO } from "@/dtos/OrderSchemas"
import { CloseSquare } from "iconsax-react"
import { Button } from "@/components/ui/button"

interface QcChecklistModalProps {
  item: ChefProductionItemDTO
  onClose: () => void
  onComplete: () => void
}

const QC_STEPS = [
  { id: 'matches_order', label: 'Cake matches order' },
  { id: 'packed_ready', label: 'Cake packed & ready' }
]

export function QcChecklistModal({ item, onClose, onComplete }: QcChecklistModalProps) {
  const [checked, setChecked] = React.useState<Record<string, boolean>>({})

  const allChecked = QC_STEPS.every(step => checked[step.id])

  const handleComplete = () => {
    if (!allChecked) return
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-black uppercase">Quality Control</h2>
            <p className="text-sm text-muted-foreground font-bold">{item.productName} • #{item.sequenceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseSquare className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground mb-4">Complete all checklist items before passing QC.</p>
          
          <div className="space-y-3">
            {QC_STEPS.map(step => (
              <label 
                key={step.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked[step.id] ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border hover:bg-muted'}`}
              >
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded accent-primary border-primary"
                  checked={!!checked[step.id]}
                  onChange={e => setChecked(prev => ({ ...prev, [step.id]: e.target.checked }))}
                />
                <span className="font-bold">{step.label}</span>
              </label>
            ))}
          </div>

          <div className="pt-4 border-t border-border mt-6">
            <Button 
              onClick={handleComplete} 
              disabled={!allChecked}
              className="w-full h-12 text-base font-black shadow-md shadow-primary/20"
            >
              Sign & Pass QC
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
