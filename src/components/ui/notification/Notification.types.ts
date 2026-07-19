import type { ReactNode } from "react"

export type NotificationType = "success" | "warning" | "info" | "error" | "system"
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
export type NotificationState = "UNREAD" | "READ" | "ARCHIVED"

export interface NotificationActor {
  id: string
  name: string
  avatar?: string
}

export interface NotificationAction {
  label: string
  onClick: (e: React.MouseEvent) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
}

export interface NotificationModel {
  /** Unique identifier for the notification */
  id: string
  /** Primary title or headline */
  title: string
  /** Secondary details/content */
  message: string
  /** Semantic type controlling icons and colors */
  type: NotificationType
  /** Urgency level (CRITICAL often implies interruption or high-vis) */
  priority: NotificationPriority
  /** Current user state */
  state: NotificationState
  /** When it was created */
  createdAt: string | Date
  /** Who triggered it (optional) */
  actor?: NotificationActor
  /** Optional link if the whole card is clickable */
  actionUrl?: string
  /** Structured payload for rendering custom UI or tracking */
  metadata?: Record<string, unknown>
}
