import * as React from "react"
import { TickCircle, Danger, Clock, CloseCircle, Box, TruckFast, Warning2 } from "iconsax-react"

export type BadgeStatus = 
  | "active" 
  | "out_of_stock" 
  | "inactive"
  | "pending"
  | "processing"
  | "DELIVERED"
  | "CANCELLED"
  | "delayed"

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus
  label?: string
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const config = {
    active: { bg: "bg-emerald-100", text: "text-emerald-700", icon: TickCircle, defaultLabel: "ACTIVE" },
    DELIVERED: { bg: "bg-emerald-100", text: "text-emerald-700", icon: TickCircle, defaultLabel: "DELIVERED" },
    
    out_of_stock: { bg: "bg-amber-100", text: "text-amber-700", icon: Warning2, defaultLabel: "OUT OF STOCK" },
    delayed: { bg: "bg-amber-100", text: "text-amber-700", icon: Warning2, defaultLabel: "DELAYED" },
    
    inactive: { bg: "bg-rose-100", text: "text-rose-700", icon: CloseCircle, defaultLabel: "INACTIVE" },
    CANCELLED: { bg: "bg-rose-100", text: "text-rose-700", icon: CloseCircle, defaultLabel: "CANCELLED" },
    
    pending: { bg: "bg-blue-100", text: "text-blue-700", icon: Clock, defaultLabel: "PENDING" },
    processing: { bg: "bg-purple-100", text: "text-purple-700", icon: Box, defaultLabel: "PROCESSING" },
  }

  const { bg, text, icon: Icon, defaultLabel } = config[status] || config.inactive
  const displayLabel = label || defaultLabel

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${bg} ${text} ${className || ""}`}
      {...props}
    >
      <Icon className="w-3.5 h-3.5" />
      {displayLabel}
    </span>
  )
}
