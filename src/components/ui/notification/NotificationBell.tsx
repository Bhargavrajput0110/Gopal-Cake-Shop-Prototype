"use client"

import * as React from "react"
import { Notification } from "iconsax-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationBadge, NotificationList } from "./Notification"
import type { NotificationModel, NotificationAction } from "./Notification.types"

export interface NotificationBellProps {
  notifications: NotificationModel[]
  renderActions?: (notification: NotificationModel) => NotificationAction[]
  onMarkRead?: (id: string) => void
  onArchive?: (id: string) => void
  onMarkAllRead?: () => void
  onViewAll?: () => void
  className?: string
}

/**
 * A ready-to-use Notification Bell popover intended for the Topbar.
 */
export function NotificationBell({
  notifications,
  renderActions,
  onMarkRead,
  onArchive,
  onMarkAllRead,
  onViewAll,
  className
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const unreadCount = notifications.filter(n => n.state === "UNREAD").length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="icon" className={cn("relative rounded-full", className)}>
            <Notification className="h-5 w-5" />
            <NotificationBadge count={unreadCount} />
            <span className="sr-only">Notifications</span>
          </Button>
        }
      />
      <PopoverContent className="w-80 sm:w-96 p-0 mr-4 mt-1" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && onMarkAllRead && (
            <button 
              onClick={onMarkAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          <NotificationList
            notifications={notifications}
            renderActions={renderActions}
            onMarkRead={onMarkRead}
            onArchive={onArchive}
          />
        </div>

        {onViewAll && (
          <div className="p-2 border-t bg-muted/20">
            <Button 
              variant="ghost" 
              className="w-full text-xs h-8"
              onClick={() => {
                setIsOpen(false)
                onViewAll()
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
