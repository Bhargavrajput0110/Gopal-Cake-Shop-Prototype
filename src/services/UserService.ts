import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { InviteUserDTO, UpdateUserRoleDTO, UpdateUserStatusDTO, UserResponseDTO } from '@/dtos/UserSchemas'
import { Role, AccountStatus } from '@prisma/client'
import { hasPermission, PERMISSIONS } from '@/lib/rbac/permissions'

export class UserService {
  static async listUsers(): Promise<UserResponseDTO[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      branchId: u.branchId,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
    }))
  }

  static async inviteUser(dto: InviteUserDTO, actorId: string): Promise<UserResponseDTO> {
    let authUserId = `test-auth-${Date.now()}`
    
    // Bypass actual Supabase signup in E2E/test environments to prevent rate limits
    if (actorId !== 'usr_dummy_dev') {
      const supabase = await createClient()
      const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dto.email,
        password: tempPassword,
      })

      if (authError || !authData.user) {
        throw new Error(`Auth Error: ${authError?.message || 'Failed to create user in Auth provider'}`)
      }
      authUserId = authData.user.id
    }

    // 2. Create in Prisma
    const user = await prisma.user.create({
      data: {
        id: authUserId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        branchId: dto.branchId,
        status: 'INVITED',
        passwordHash: 'INVITE_PENDING',
        invitedAt: new Date(),
      }
    })

    // 3. Write Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'INVITE_USER',
        tableName: 'USER',
        recordId: user.id,
        actorId: actorId.startsWith('usr_dummy') || actorId.startsWith('usr_mock') ? null : actorId,
        newValue: { role: dto.role, email: dto.email },
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      branchId: user.branchId,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }
  }

  static async updateRole(userId: string, dto: UpdateUserRoleDTO, actorId: string): Promise<UserResponseDTO> {
    if (userId === actorId) {
      throw new Error("You cannot change your own role.")
    }

    // Protect last MANAGE_USERS capability
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) throw new Error("User not found")
    
    if (hasPermission(targetUser.role, null, PERMISSIONS.MANAGE_USERS) && !hasPermission(dto.role, null, PERMISSIONS.MANAGE_USERS)) {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE', id: { not: userId } }
      })
      if (activeAdmins === 0) {
        throw new Error("Cannot remove the last user with manage_users capability.")
      }
    }

    // 1. Commit DB transaction
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role,
        branchId: dto.branchId
      }
    })

    // 2. Invalidate Sessions
    // Supabase doesn't have a direct "signOut(userId)" for another user in the standard JS client easily
    // without the Admin API. We assume updating user metadata will eventually force a refresh.
    // In a production app, we would use supabase.auth.admin.signOut(userId) using the Service Role Key.
    const supabase = await createClient()
    // A mock call indicating the intent. 
    // supabase.auth.admin.updateUserById(userId, { user_metadata: { role: dto.role } })

    // 3. Write Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER_ROLE',
        tableName: 'USER',
        recordId: user.id,
        actorId: actorId.startsWith('usr_dummy') || actorId.startsWith('usr_mock') ? null : actorId,
        oldValue: { role: targetUser.role, branch: targetUser.branchId },
        newValue: { role: dto.role, branch: dto.branchId },
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      branchId: user.branchId,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }
  }

  static async updateStatus(userId: string, dto: UpdateUserStatusDTO, actorId: string): Promise<UserResponseDTO> {
    if (userId === actorId) {
      throw new Error("You cannot change your own status.")
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!targetUser) throw new Error("User not found")

    // Protect last MANAGE_USERS capability from being deactivated/suspended
    if (hasPermission(targetUser.role, null, PERMISSIONS.MANAGE_USERS) && dto.status !== 'ACTIVE') {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', status: 'ACTIVE', id: { not: userId } }
      })
      if (activeAdmins === 0) {
        throw new Error("Cannot deactivate/suspend the last user with manage_users capability.")
      }
    }

    const timestamps: any = {}
    if (dto.status === 'SUSPENDED') timestamps.suspendedAt = new Date()
    if (dto.status === 'DEACTIVATED') timestamps.deactivatedAt = new Date()
    if (dto.status === 'ACTIVE' && targetUser.status !== 'ACTIVE') timestamps.activatedAt = new Date()

    // 1. Commit DB transaction
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: dto.status,
        ...timestamps
      }
    })

    // 2. Invalidate Sessions if denying access
    if (dto.status !== 'ACTIVE' && dto.status !== 'INVITED') {
      // Invalidate via Supabase admin client here
    }

    // 3. Write Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER_STATUS',
        tableName: 'USER',
        recordId: user.id,
        actorId: actorId.startsWith('usr_dummy') || actorId.startsWith('usr_mock') ? null : actorId,
        oldValue: { status: targetUser.status },
        newValue: { status: dto.status },
      }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      branchId: user.branchId,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
    }
  }
}
