import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { LoggerService } from '@/services/LoggerService'

// Create a new ratelimiter, that allows 5 requests per 1 minute for Auth
const redisConfigured = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = redisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : ({} as Redis) // Mock object for graceful bypass if not configured locally

export const authRateLimit = redisConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null

export const publicApiRateLimit = redisConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/public',
    })
  : null

export const internalApiRateLimit = redisConfigured
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/internal',
    })
  : null

export async function enforceRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  requestId: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!limiter) {
    // Graceful bypass for local dev
    return { success: true, limit: 100, remaining: 99, reset: 0 }
  }

  try {
    const res = await limiter.limit(identifier)
    if (!res.success) {
      LoggerService.warn('Rate limit exceeded', { identifier, requestId })
    }
    return res
  } catch (err) {
    // If Redis fails, fail open so we don't break the app, but log it
    LoggerService.error('Rate Limiter Error', err, { identifier, requestId })
    return { success: true, limit: 100, remaining: 99, reset: 0 }
  }
}
