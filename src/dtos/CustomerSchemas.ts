import { z } from 'zod'

export const CreateCustomerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  email: z.string().email('Invalid email').nullable().optional(),
  address: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
})

export type CreateCustomerDTO = z.infer<typeof CreateCustomerSchema>

export type CustomerResponseDTO = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  totalOrders: number
  isActive: boolean
  createdAt: string
}
