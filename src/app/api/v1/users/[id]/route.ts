import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { UserService } from '@/services/UserService'
import { UpdateUserRoleSchema, UpdateUserStatusSchema } from '@/dtos/UserSchemas'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export const PATCH = withApiHandler(async (ctx) => {
  const body = await ctx.req.json()
  const id = ctx.params.id

  // Determine which schema matches the payload
  if (body.role) {
    const data = UpdateUserRoleSchema.parse(body)
    const user = await UserService.updateRole(id, data, ctx.user.id)
    return NextResponse.json(user)
  }

  if (body.status) {
    const data = UpdateUserStatusSchema.parse(body)
    const user = await UserService.updateStatus(id, data, ctx.user.id)
    return NextResponse.json(user)
  }

  return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
}, false, PERMISSIONS.MANAGE_USERS)
