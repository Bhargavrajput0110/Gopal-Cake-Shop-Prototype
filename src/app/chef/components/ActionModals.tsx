import * as React from "react"
import { ChefProductionItemDTO } from "@/dtos/OrderSchemas"
import { CloseSquare, Warning2, Pause } from "iconsax-react"
import { Button } from "@/components/ui/button"

// --- PAUSE MODAL ---
interface PauseModalProps {
  item: ChefProductionItemDTO
  onClose: () => void
  onConfirm: (reason: string) => void
}

const PAUSE_REASONS = [
  "Out of Cream",
  "Base Cake Not Ready",
  "Waiting for Customer Clarification",
  "Equipment Issue",
  "Other"
]

export function PauseModal({ item, onClose, onConfirm }: PauseModalProps) {
  const [reason, setReason] = React.useState(PAUSE_REASONS[0])
  const [customReason, setCustomReason] = React.useState("")

  const handleSubmit = () => {
    onConfirm(reason === "Other" ? customReason : reason)
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-black uppercase flex items-center gap-2"><Pause className="w-5 h-5" /> Pause Item</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground"><CloseSquare className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm font-bold text-muted-foreground">Select reason for pausing:</p>
          <select 
            className="w-full h-10 px-3 bg-background border border-border rounded font-bold text-sm"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            {PAUSE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {reason === "Other" && (
            <input 
              type="text" 
              placeholder="Enter custom reason..." 
              className="w-full h-10 px-3 bg-background border border-border rounded font-bold text-sm"
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
            />
          )}
          <Button 
            onClick={handleSubmit} 
            className="w-full font-bold" 
            variant="default"
            disabled={reason === "Other" && customReason.trim() === ""}
          >
            Confirm Pause
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- INGREDIENT REQUEST MODAL ---
interface IngredientRequestModalProps {
  item: ChefProductionItemDTO
  onClose: () => void
  onConfirm: (reason: string, note: string) => void
}

const INGREDIENTS = [
  "Choco Sponge", "Vanilla Sponge", "Rainbow Sponge", "Dark Chocolate", 
  "Milk Chocolate", "White Chocolate", "White Choco Chips", "Black Choco Chips", 
  "Fondant (Colour)", "Gel Colour (Colour)", "Nutella", "Biscoff Spread", 
  "Biscoff Biscuit", "Butterfly (Colour)", "Hamper Tray", "Hamper Box", 
  "Topper", "Flower", "Mould", "Oreo", "Five Star", "KitKat", "Other"
]

export function IngredientRequestModal({ item, onClose, onConfirm }: IngredientRequestModalProps) {
  const [reason, setReason] = React.useState(INGREDIENTS[0])
  const [note, setNote] = React.useState("")

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-lg rounded-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-amber-500/10 text-amber-600">
          <h2 className="text-lg font-black uppercase flex items-center gap-2"><Warning2 className="w-5 h-5" /> Request Ingredient</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-amber-500/20"><CloseSquare className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-4">
          <select 
            className="w-full h-10 px-3 bg-background border border-border rounded font-bold text-sm"
            value={reason}
            onChange={e => setReason(e.target.value)}
          >
            {INGREDIENTS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {(reason.includes("(Colour)") || reason === "Other") && (
            <textarea 
              placeholder={reason.includes("(Colour)") ? "Specify colour..." : "Specify item..."}
              className="w-full h-20 p-3 bg-background border border-border rounded font-bold text-sm resize-none"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          )}
          <Button onClick={() => onConfirm(reason, note)} className="w-full font-bold bg-amber-600 hover:bg-amber-700 text-white">
            Send Request
          </Button>
        </div>
      </div>
    </div>
  )
}

// --- FULLSCREEN IMAGE MODAL ---
interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
      <div className="flex justify-end p-4">
        <button onClick={onClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20">
          <CloseSquare className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <img src={imageUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  )
}
