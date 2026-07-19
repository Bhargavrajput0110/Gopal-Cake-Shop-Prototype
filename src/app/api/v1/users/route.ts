import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { UserService } from '@/services/UserService'
import { InviteUserSchema } from '@/dtos/UserSchemas'
import { PERMISSIONS } from '@/lib/rbac/permissions'

export const GET = withApiHandler(async () => {
  const users = await UserService.listUsers()
  return NextResponse.json(users)
}, false, PERMISSIONS.MANAGE_USERS)

export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json()
  const data = InviteUserSchema.parse(body)

  const user = await UserService.inviteUser(data, ctx.user.id)
  return NextResponse.json(user, { status: 201 })
}, false, PERMISSIONS.MANAGE_USERS)
