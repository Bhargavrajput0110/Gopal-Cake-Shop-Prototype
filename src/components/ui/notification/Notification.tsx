"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { Notification, TickCircle, Warning2, InfoCircle, CloseCircle, Setting2, ArrowRight2, TickSquare } from "iconsax-react"
import type { NotificationModel, NotificationAction, NotificationType } from "./Notification.types"
import { Button } from "@/components/ui/button"

// ─── Utils & Config ──────────────────────────────────────────────────────────

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  success: { icon: TickCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  warning: { icon: Warning2, color: "text-amber-500", bg: "bg-amber-500/10" },
  error: { icon: CloseCircle, color: "text-destructive", bg: "bg-destructive/10" },
  info: { icon: InfoCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
  system: { icon: Setting2, color: "text-muted-foreground", bg: "bg-muted" },
}

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * A standalone badge representing an unread notification count.
 */
export const NotificationBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { count: number; max?: number }
>(({ className, count, max = 99, ...props }, ref) => {
  if (count <= 0) return null
  return (
    <span
      ref={ref}
      className={cn(
        "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background",
        className
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  )
})
NotificationBadge.displayName = "NotificationBadge"

/**
 * Empty state for a notification list.
 */
export const NotificationEmptyState = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
    {...props}
  >
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Notification className="h-6 w-6 text-muted-foreground opacity-50" />
    </div>
    <p className="mt-4 text-sm font-semibold text-foreground">No notifications</p>
    <p className="mt-1 text-xs text-muted-foreground">You're all caught up!</p>
  </div>
))
NotificationEmptyState.displayName = "NotificationEmptyState"


// ─── Card ─────────────────────────────────────────────────────────────────────

export interface NotificationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  notification: NotificationModel
  actions?: NotificationAction[]
  onMarkRead?: (id: string) => void
  onArchive?: (id: string) => void
}

export const NotificationCard = React.forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ className, notification, actions, onMarkRead, onArchive, ...props }, ref) => {
    const isUnread = notification.state === "UNREAD"
    const cfg = typeConfig[notification.type]
    const Icon = cfg.icon

    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex gap-3 p-4 transition-colors hover:bg-muted/50",
          isUnread ? "bg-primary/5" : "bg-card",
          notification.priority === "CRITICAL" && "border-l-2 border-l-destructive",
          className
        )}
        {...props}
      >
        {/* Unread dot */}
        {isUnread && (
          <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" aria-hidden="true" />
        )}

        {/* Icon or Avatar */}
        <div className={cn("mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full", cfg.bg)}>
          {notification.actor?.avatar ? (
             <img src={notification.actor.avatar} alt={notification.actor.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <Icon className={cn("h-4 w-4", cfg.color)} />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium leading-tight", isUnread ? "text-foreground" : "text-muted-foreground")}>
              {notification.title}
              {notification.actor?.name && (
                <span className="font-normal opacity-80"> by {notification.actor.name}</span>
              )}
            </p>
            <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {notification.message}
          </p>

          {/* Action Slots */}
          {(actions?.length || notification.actionUrl) && (
            <div className="mt-2 flex items-center gap-2">
              {actions?.map((action, i) => (
                <Button 
                  key={i} 
                  variant={action.variant ?? "outline"} 
                  size="sm" 
                  className="h-7 text-xs px-2.5"
                  onClick={(e) => { e.stopPropagation(); action.onClick(e); }}
                >
                  {action.label}
                </Button>
              ))}
              {notification.actionUrl && (
                <a 
                  href={notification.actionUrl} 
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5 ml-auto"
                >
                  View Details <ArrowRight2 className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Hover Controls */}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 flex items-center gap-1">
           {isUnread && onMarkRead && (
             <button 
               onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id) }}
               className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
               title="Mark as read"
             >
               <TickSquare className="h-3.5 w-3.5" />
             </button>
           )}
           {onArchive && (
             <button 
               onClick={(e) => { e.stopPropagation(); onArchive(notification.id) }}
               className="p-1 rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
               title="Archive"
             >
               <CloseCircle className="h-3.5 w-3.5" />
             </button>
           )}
        </div>
      </div>
    )
  }
)
NotificationCard.displayName = "NotificationCard"


// ─── List ─────────────────────────────────────────────────────────────────────

export interface NotificationListProps extends React.HTMLAttributes<HTMLDivElement> {
  notifications: NotificationModel[]
  renderActions?: (notification: NotificationModel) => NotificationAction[]
  onMarkRead?: (id: string) => void
  onArchive?: (id: string) => void
  emptyState?: React.ReactNode
}

export const NotificationList = React.forwardRef<HTMLDivElement, NotificationListProps>(
  ({ className, notifications, renderActions, onMarkRead, onArchive, emptyState, ...props }, ref) => {
    if (!notifications.length) {
      return <>{emptyState ?? <NotificationEmptyState />}</>
    }

    return (
      <div ref={ref} className={cn("flex flex-col divide-y divide-border", className)} {...props}>
        {notifications.map((notif) => (
          <NotificationCard
            key={notif.id}
            notification={notif}
            actions={renderActions?.(notif)}
            onMarkRead={onMarkRead}
            onArchive={onArchive}
          />
        ))}
      </div>
    )
  }
)
NotificationList.displayName = "NotificationList"
