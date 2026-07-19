'use client'

import * as React from "react"
import { useState } from "react"
import { OrdersApiClient } from "@/lib/api/orders.api"
import { TickSquare, Stop, TickCircle, ShieldTick } from "iconsax-react"
import { Button } from "@/components/ui/button"

interface QCProps {
  orderId: string
  existingQC?: {
    items: Record<string, boolean>
    checkedBy: string
    completedAt: string
  } | null
  onSuccess?: () => void
}

const DEFAULT_CHECKS = [
  { id: 'weight', label: 'Weight verified' },
  { id: 'message', label: 'Message on cake verified' },
  { id: 'decoration', label: 'Decoration & Theme verified' },
  { id: 'photo', label: 'Photo cake image matched (if applicable)' },
  { id: 'packaging', label: 'Packaging completed securely' },
  { id: 'invoice', label: 'Invoice / Receipt inserted' },
  { id: 'accessories', label: 'Accessories (Knife, Candles, Tags) added' },
]

export function QualityControlChecklist({ orderId, existingQC, onSuccess }: QCProps) {
  const [checks, setChecks] = useState<Record<string, boolean>>(
    existingQC?.items || DEFAULT_CHECKS.reduce((acc, curr) => ({ ...acc, [curr.id]: false }), {})
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAllChecked = DEFAULT_CHECKS.every(c => checks[c.id] === true)
  const isCompleted = !!existingQC

  const toggleCheck = (id: string) => {
    if (isCompleted) return // Read-only if already completed
    setChecks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    if (!isAllChecked) return
    setIsSubmitting(true)
    try {
      await OrdersApiClient.saveQC(orderId, checks)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Failed to save QC", error)
      alert("Failed to save QC Checklist.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 space-y-3">
        <h3 className="font-bold text-emerald-800 flex items-center gap-2">
          <ShieldTick className="w-5 h-5 text-emerald-600" />
          Quality Control Passed
        </h3>
        <div className="space-y-1">
          {DEFAULT_CHECKS.map(check => (
            <div key={check.id} className="flex items-center gap-2 text-sm text-emerald-700/80">
              <TickSquare className="w-4 h-4" />
              <span>{check.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-emerald-200/50 text-xs font-medium text-emerald-800">
          <p>Checked by: <span className="font-bold">{existingQC.checkedBy}</span></p>
          <p>Completed: <span className="font-bold">{new Date(existingQC.completedAt).toLocaleString()}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ShieldTick className="w-5 h-5 text-primary" />
          Pre-Dispatch Quality Control
        </h3>
        <p className="text-sm text-muted-foreground">Mandatory verification before marking order as Ready.</p>
      </div>

      <div className="space-y-2 py-2">
        {DEFAULT_CHECKS.map(check => {
          const isChecked = checks[check.id]
          return (
            <div 
              key={check.id} 
              onClick={() => toggleCheck(check.id)}
              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors border ${
                isChecked ? 'bg-primary/5 border-primary/20 text-foreground' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {isChecked ? (
                <TickSquare className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Stop className="w-5 h-5 shrink-0" />
              )}
              <span className={`text-sm font-medium select-none ${isChecked ? '' : ''}`}>
                {check.label}
              </span>
            </div>
          )
        })}
      </div>

      <Button 
        className="w-full" 
        size="lg" 
        disabled={!isAllChecked || isSubmitting}
        onClick={handleSave}
      >
        {isSubmitting ? 'Saving...' : 'Sign Off & Verify'}
      </Button>
    </div>
  )
}
