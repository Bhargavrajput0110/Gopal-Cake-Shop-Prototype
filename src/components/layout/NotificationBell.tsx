'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Notification, TickCircle, CloseCircle, InfoCircle, Warning2 } from 'iconsax-react'
import { fetchClient } from '@/lib/api/client'
import { useSSE } from '@/hooks/useSSE'

type InAppNotification = {
  id: string
  title: string
  message: string
  isRead: boolean
  isDismissed: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  linkUrl?: string | null
  createdAt: string
}

const priorityIcon = (p: InAppNotification['priority']) => {
  if (p === 'URGENT' || p === 'HIGH') return <Warning2 className="w-4 h-4 text-rose-500 shrink-0" />
  if (p === 'NORMAL') return <InfoCircle className="w-4 h-4 text-blue-500 shrink-0" />
  return <TickCircle className="w-4 h-4 text-emerald-500 shrink-0" />
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Connect to SSE stream — auto-reconnects on drop
  useSSE({
    onNotification: () => {
      // Flash the bell when a new notification arrives
      queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] })
    },
  })

  const { data } = useQuery({
    queryKey: ['notifications-inbox'],
    queryFn: () =>
      fetchClient<{ success: boolean; data: InAppNotification[] }>(
        '/api/v1/notifications/inbox?unreadOnly=false'
      ),
    refetchInterval: 60_000, // Polling fallback if SSE drops
  })

  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead && !n.isDismissed).length

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/v1/notifications/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'READ' }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] }),
  })

  const { mutate: dismiss } = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/v1/notifications/inbox/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'DISMISS' }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] }),
  })

  const markAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => markRead(n.id))
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        id="notification-bell-btn"
      >
        <Notification className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-card"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-border/60 z-50 overflow-hidden"
            id="notification-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/30">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-border/30">
              {notifications.filter((n) => !n.isDismissed).length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                  <Notification className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">All caught up!</p>
                </div>
              ) : (
                notifications
                  .filter((n) => !n.isDismissed)
                  .map((n) => (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                    >
                      {priorityIcon(n.priority)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Mark as read"
                          >
                            <TickCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(n.id)}
                          className="p-1 text-muted-foreground hover:bg-secondary rounded transition-colors"
                          title="Dismiss"
                        >
                          <CloseCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
