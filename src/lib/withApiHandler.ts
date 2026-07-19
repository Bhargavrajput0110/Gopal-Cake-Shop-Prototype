import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { errorResponse, generateRequestId } from '@/lib/apiUtils'
import { LoggerService } from '@/services/LoggerService'
import { enforceRateLimit, internalApiRateLimit, publicApiRateLimit } from '@/lib/rateLimit'
import { createServerClient } from '@supabase/ssr'

import { Capability, hasPermission } from '@/lib/rbac/permissions'
import { Role } from '@prisma/client'
import { auth } from '@/auth'
import { toBranchId } from '@/lib/branches'

export type ApiContext = {
  params: Promise<Record<string, string>> | Record<string, string>
}

export type HandlerContext = {
  req: NextRequest
  requestId: string
  user: any // Supabase user
  appRole: Role | null
  branchId: string | null
  params: Record<string, string>
}

type ApiHandler = (ctx: HandlerContext) => Promise<Response>

export function withApiHandler(handler: ApiHandler, isPublic: boolean = false, requiredPermission?: Capability) {
  return async (req: NextRequest, ctx: ApiContext = { params: {} }): Promise<Response> => {
    const resolvedParams = await ctx.params
    const requestId = generateRequestId()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const identifier = isPublic ? ip : (req.cookies.get('sb-access-token')?.value || ip)

    // Rate Limiting
    const rateLimitResult = await enforceRateLimit(
      isPublic ? publicApiRateLimit : internalApiRateLimit,
      identifier,
      requestId
    )

    if (!rateLimitResult.success) {
      return errorResponse('Too Many Requests', 'RATE_LIMIT_EXCEEDED', 429, [], requestId)
    }

    let user = null
    let appRole = null
    let branchId = null

    // Authentication (if not public)
    if (!isPublic) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // Read-only in Route Handlers
            },
          },
        }
      )
      
      const isTestBypassEnabled = process.env.ENABLE_TEST_BYPASS === 'true' || process.env.NODE_ENV !== 'production'
      const hasBypassCookie = req.cookies.get('e2e-bypass-auth')?.value === 'true'
      const dummyRole = req.cookies.get('gopal_dummy_role')?.value

      if (isTestBypassEnabled && hasBypassCookie) {
        // Mock a system admin user for load tests
        user = { id: 'usr_mock_loadtest', email: 'loadtest@example.com' }
        appRole = Role.ADMIN
        branchId = 'b-001'
      } else if (dummyRole) {
        // Mock user from prototype login screen
        user = { id: 'usr_dummy_dev', email: `dummy_${dummyRole.toLowerCase()}@example.com` }
        appRole = dummyRole.toUpperCase() as Role
        branchId = 'b-001'
      } else {
        // 1. Try NextAuth (used by standard UI login)
        const session = await auth()
        if (session?.user) {
          user = { id: session.user.id, email: session.user.email || null }
          appRole = ((session.user as any).role as string)?.toUpperCase() as Role
          branchId = (session.user as any).branchId || null
        } else {
          // 2. Try Supabase Auth (used by mobile apps / external clients)
          const { data: authData } = await supabase.auth.getUser()
          if (authData?.user) {
            user = authData.user
            appRole = user.user_metadata?.role || null
            branchId = user.user_metadata?.branchId || null
          }
        }

        if (!user) {
          LoggerService.warn(`Unauthorized Access: ${req.method} ${req.nextUrl.pathname}`, { requestId, ip, userAgent })
          return errorResponse('Unauthorized', 'UNAUTHORIZED', 401, [], requestId)
        }
        // Dev Sync: Fetch from Prisma if email matches
        if (user.email) {
          const prismaUser = await prisma.user.findUnique({ where: { email: user.email } })
          if (prismaUser) {
            appRole = prismaUser.role as Role
            branchId = prismaUser.branchId
            
            if (prismaUser.status !== 'ACTIVE') {
               LoggerService.warn(`Access Denied: Account Status ${prismaUser.status}`, { requestId, email: user.email })
               return errorResponse(`Account is ${prismaUser.status}`, 'FORBIDDEN', 403, [], requestId)
            }

            // OVERRIDE user object with Prisma ID to prevent Foreign Key constraints failing
            user.id = prismaUser.id
          }
        }
      }
      
      if (branchId) {
        branchId = toBranchId(branchId)
      }

      // RBAC Enforcement
      if (requiredPermission && appRole) {
        // We evaluate purely on the server. If they need a branch context for this route,
        // it must be extracted from params or body, but by default we check general access.
        // For branch-scoped operations (like editing a specific order), the Service layer must re-verify context.
        if (!hasPermission(appRole, branchId, requiredPermission)) {
           LoggerService.warn(`RBAC Denied: Missing ${requiredPermission}`, { requestId, role: appRole })
           return errorResponse('Permission Denied', 'FORBIDDEN', 403, [], requestId)
        }
      } else if (requiredPermission && !appRole) {
        return errorResponse('Permission Denied: No Role Assigned', 'FORBIDDEN', 403, [], requestId)
      }
    }

    const startTime = Date.now()

    try {
      // Execute the actual handler
      const response = await handler({ req, requestId, user, appRole, branchId, params: resolvedParams })
      const executionTime = Date.now() - startTime
      LoggerService.info(`API Response: ${req.method} ${req.nextUrl.pathname}`, { requestId, ip, user: user?.id, userAgent, status: response.status, executionTimeMs: executionTime })
      return response
    } catch (error: any) {
      const executionTime = Date.now() - startTime
      LoggerService.error(`API Error: ${req.method} ${req.nextUrl.pathname}`, error, { requestId, userAgent, executionTimeMs: executionTime })

      console.error('[withApiHandler] Caught error:', error);

      if (error && (error.name === 'ZodError' || error instanceof ZodError)) {
        const issues = (error as any).issues || (error as any).errors || []
        const details = issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }))

        return errorResponse('Validation Failed', 'VALIDATION_ERROR', 400, details, requestId)
      }

      if (error.message === 'INVALID_SETTING_KEY') {
        return errorResponse('Invalid Setting Key', 'FORBIDDEN', 403, [], requestId)
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // e.g., P2002 Unique constraint failed
        if (error.code === 'P2002') {
          return errorResponse('Resource already exists', 'CONFLICT', 409, [], requestId)
        }
        if (error.code === 'P2025') {
          return errorResponse('Resource not found', 'NOT_FOUND', 404, [], requestId)
        }
        return errorResponse('Database Error', 'DATABASE_ERROR', 500, [], requestId)
      }

      if (error.message.includes('CONCURRENCY_ERROR') || error.message.includes('Invalid state transition') || error.message === 'REASON_REQUIRED') {
        return errorResponse(error.message, 'CONFLICT', 409, [], requestId)
      }

      if (error.message === 'FORBIDDEN' || error.message.includes('Permission denied')) {
        return errorResponse(error.message, 'FORBIDDEN', 403, [], requestId)
      }

      return errorResponse(
        error.message || 'Internal Server Error',
        error.code || 'INTERNAL_ERROR',
        error.status || 500,
        [],
        requestId
      )
    }
  }
}
