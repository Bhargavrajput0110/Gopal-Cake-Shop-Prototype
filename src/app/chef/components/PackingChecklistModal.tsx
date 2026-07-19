import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ChefProductionItemDTO } from '@/dtos/OrderSchemas'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/client'
import { TickSquare, Stop, CloseSquare } from "iconsax-react"

interface PackingChecklistModalProps {
  item: ChefProductionItemDTO
  onClose: () => void
  onComplete: () => void
}

export function PackingChecklistModal({ item, onClose, onComplete }: PackingChecklistModalProps) {
  const { data: config } = useQuery({
    queryKey: ['settings', 'packing_checklist'],
    queryFn: () => fetchClient<{value: string}>(`/settings/packing_checklist`).catch(() => null)
  })

  const checklistItems = React.useMemo(() => {
    if (!config?.value) {
      return [
        { id: 'cake', label: 'Cake' },
        { id: 'knife', label: 'Knife' },
        { id: 'candles', label: 'Candles' },
        { id: 'bill', label: 'Bill' }
      ]
    }
    try {
      return JSON.parse(config.value)
    } catch {
      return []
    }
  }, [config])

  const [checked, setChecked] = React.useState<Set<string>>(new Set())

  const toggleCheck = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

  const isComplete = checked.size === checklistItems.length

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border shadow-xl rounded-xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b flex justify-between items-center bg-muted/30">
          <h3 className="font-black text-lg">Packing Verification</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground"><CloseSquare className="w-5 h-5"/></button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <p className="text-sm font-bold text-muted-foreground mb-4">
            Verify all items are present before packing #{item.sequenceNumber}.
          </p>

          {checklistItems.map((c: any) => (
            <button 
              key={c.id}
              onClick={() => toggleCheck(c.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${checked.has(c.id) ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30 text-foreground'}`}
            >
              {checked.has(c.id) ? <TickSquare className="w-5 h-5" /> : <Stop className="w-5 h-5" />}
              <span className="font-bold">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t bg-muted/10">
          <Button 
            className="w-full h-12 text-lg font-black" 
            disabled={!isComplete} 
            onClick={onComplete}
          >
            Confirm Packed
          </Button>
        </div>
      </div>
    </div>
  )
}
