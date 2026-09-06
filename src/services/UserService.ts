import { prisma } from '@/lib/prisma'
// Removed unused supabase import
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
    // Since migration to NextAuth (auth.ts) with Prisma, we no longer need to sync with Supabase Auth.
    // We just generate a standard CUID for the new user ID.
    const authUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

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
    // without the Admin API. Since we use NextAuth now, session invalidation would require a separate mechanism
    // (e.g., storing a session valid-after timestamp in the DB). For now, we update the DB.

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
