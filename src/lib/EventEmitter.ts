import { EventEmitter } from 'events'

/**
 * A singleton EventEmitter used to broadcast real-time events across
 * request handlers within the same Node.js process.
 *
 * For multi-instance / clustered deployments, replace this with a
 * Redis pub/sub adapter (e.g. ioredis) without changing any call sites.
 */
class GlobalEventEmitter extends EventEmitter {}

// Attach to global to survive Next.js hot-module reloads in development
const g = global as typeof global & { _eventEmitter?: GlobalEventEmitter }

if (!g._eventEmitter) {
  g._eventEmitter = new GlobalEventEmitter()
  g._eventEmitter.setMaxListeners(200) // Support up to 200 concurrent SSE connections
}

export const globalEventEmitter = g._eventEmitter
