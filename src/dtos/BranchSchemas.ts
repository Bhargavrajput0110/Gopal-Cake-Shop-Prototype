import { z } from 'zod'

export const CreateBranchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required').max(10),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  deliveryEnabled: z.boolean().default(true),
})

export type CreateBranchDTO = z.infer<typeof CreateBranchSchema>

export type BranchResponseDTO = {
  id: string
  name: string
  code: string
  address: string
  phone: string | null
  isActive: boolean
  deliveryEnabled: boolean
}
