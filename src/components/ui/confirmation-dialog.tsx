import * as React from "react"
import { Danger, Trash, CloseSquare } from "iconsax-react"

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "default"
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={isLoading ? undefined : onClose}
      />
      
      <div className="relative bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors disabled:opacity-50"
        >
          <CloseSquare className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-rose-100 text-rose-600' :
            variant === 'warning' ? 'bg-amber-100 text-amber-600' :
            'bg-primary/10 text-primary'
          }`}>
            {variant === 'danger' ? <Trash className="w-6 h-6" /> : <Danger className="w-6 h-6" />}
          </div>
          
          <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
          <p className="text-sm text-muted-foreground mb-8">
            {description}
          </p>

          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-secondary text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20' :
                variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20' :
                'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20'
              }`}
            >
              {isLoading ? "Please wait..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
