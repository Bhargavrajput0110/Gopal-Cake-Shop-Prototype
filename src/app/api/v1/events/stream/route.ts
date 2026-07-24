import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { globalEventEmitter } from '@/lib/EventEmitter'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/v1/events/stream
 *
 * Server-Sent Events endpoint. Streams InAppNotification events to the
 * authenticated client in real-time. The client will auto-reconnect via the
 * browser's native EventSource reconnection logic.
 *
 * Events emitted:
 *   - "notification" — a new InAppNotification has been created for the user
 *   - "heartbeat"    — sent every 30s to keep the connection alive through proxies
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = (session.user as any).id as string

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Controller closed — connection dropped
        }
      }

      // Flush unread notifications immediately on connect so the bell populates instantly
      prisma.inAppNotification
        .findMany({
          where: { userId, isRead: false, isDismissed: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
        .then((notifications) => {
          send('init', { notifications })
        })
        .catch(() => {
          // Non-fatal — client will poll on next reconnect
        })

      // Listen for new notifications dispatched to this user
      const onNotification = (payload: { userId: string; notification: unknown }) => {
        if (payload.userId === userId) {
          send('notification', payload.notification)
        }
      }

      globalEventEmitter.on('notification', onNotification)

      // Heartbeat every 30 seconds to keep connection alive through load balancers
      const heartbeat = setInterval(() => {
        send('heartbeat', { ts: Date.now() })
      }, 30_000)

      // Clean up when the client disconnects
      req.signal.addEventListener('abort', () => {
        globalEventEmitter.off('notification', onNotification)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx proxy buffering
    },
  })
}
