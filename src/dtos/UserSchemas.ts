import { z } from 'zod'
import { Role, AccountStatus } from '@prisma/client'

export const InviteUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().nullable().optional(),
  role: z.nativeEnum(Role),
  branchId: z.string().nullable().optional(),
})

export const UpdateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
  branchId: z.string().nullable().optional(),
})

export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
})

export type InviteUserDTO = z.infer<typeof InviteUserSchema>
export type UpdateUserRoleDTO = z.infer<typeof UpdateUserRoleSchema>
export type UpdateUserStatusDTO = z.infer<typeof UpdateUserStatusSchema>

export type UserResponseDTO = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: Role
  status: AccountStatus
  branchId: string | null
  createdAt: string
  lastLoginAt: string | null
}
