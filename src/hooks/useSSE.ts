'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

type SSEEvent = {
  type: 'notification' | 'heartbeat' | 'init'
  data: unknown
}

type UseSSEOptions = {
  /** Called when a new notification event arrives */
  onNotification?: (notification: unknown) => void
  /** Disable the connection (e.g. for unauthenticated users) */
  enabled?: boolean
}

/**
 * useSSE — connects to the /api/v1/events/stream SSE endpoint.
 *
 * On each "notification" event:
 *   1. Calls the optional onNotification callback.
 *   2. Invalidates React Query caches for orders and notifications so all
 *      consuming components refresh automatically.
 *
 * Auto-reconnects with exponential back-off on unexpected disconnects.
 */
export function useSSE({ onNotification, enabled = true }: UseSSEOptions = {}) {
  const queryClient = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const reconnectDelay = useRef(1000)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return

    const es = new EventSource('/api/v1/events/stream')
    esRef.current = es

    es.addEventListener('init', (e: MessageEvent) => {
      try {
        const { notifications } = JSON.parse(e.data)
        // Pre-seed the notification inbox cache
        queryClient.setQueryData(['notifications-inbox'], notifications)
      } catch {}
    })

    es.addEventListener('notification', (e: MessageEvent) => {
      try {
        const notification = JSON.parse(e.data)
        onNotification?.(notification)
        // Invalidate so all notification-dependent components re-fetch
        queryClient.invalidateQueries({ queryKey: ['notifications-inbox'] })
        // Also invalidate orders in case the notification was triggered by an order event
        queryClient.invalidateQueries({ queryKey: ['orders'] })
      } catch {}
    })

    es.addEventListener('heartbeat', () => {
      // Reset backoff on successful heartbeat
      reconnectDelay.current = 1000
    })

    es.onerror = () => {
      es.close()
      esRef.current = null
      if (!mountedRef.current) return
      // Exponential back-off: 1s → 2s → 4s → 8s → max 30s
      const delay = Math.min(reconnectDelay.current, 30_000)
      reconnectDelay.current = delay * 2
      setTimeout(connect, delay)
    }
  }, [enabled, onNotification, queryClient])

  useEffect(() => {
    mountedRef.current = true
    if (enabled) connect()

    return () => {
      mountedRef.current = false
      esRef.current?.close()
      esRef.current = null
    }
  }, [enabled, connect])
}
