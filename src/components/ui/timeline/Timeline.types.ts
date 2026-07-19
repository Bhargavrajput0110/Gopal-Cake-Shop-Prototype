import type { ReactNode } from "react"

export type TimelineEventColor = "default" | "info" | "success" | "warning" | "destructive" | "muted"

export interface TimelineEventActor {
  id: string
  name: string
  avatar?: string
}

export interface TimelineEvent {
  /** Unique identifier for the event */
  id: string
  /** ISO date string or Date object */
  timestamp: Date | string
  /** Primary headline of the event */
  title: ReactNode
  /** Secondary details */
  description?: ReactNode
  /** The person or system that triggered the event */
  actor?: TimelineEventActor
  /** Lucide icon component to display */
  icon?: React.ElementType
  /** Visual intent indicator */
  color?: TimelineEventColor
  /** Broad categorization for filtering/styling */
  type?: "system" | "user" | "audit" | "payment" | string
  /** Additional structured data associated with the event */
  metadata?: Record<string, unknown>
}
