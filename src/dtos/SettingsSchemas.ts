import { z } from 'zod'

export const CreateSettingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().nullable().optional(),
})

export const UpdateSettingSchema = CreateSettingSchema.partial()

export type CreateSettingDTO = z.infer<typeof CreateSettingSchema>

export type SettingResponseDTO = {
  id: string
  key: string
  value: string
  description: string | null
  updatedAt: string
}
