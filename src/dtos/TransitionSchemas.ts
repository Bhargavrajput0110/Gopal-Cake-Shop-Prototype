import { z } from 'zod'

export const TransitionActionSchema = z.enum([
  'checkout',
  'approve',
  'chef-accept',
  'start-making',
  'start-decorating',
  'ready',
  'assign-driver',
  'pick-up',
  'on-the-way',
  'deliver',
  'fail-delivery',
  'complete',
  'cancel',
  'auto-queue',
  'send-quote'
])

export const ExecuteTransitionSchema = z.object({
  action: TransitionActionSchema,
  note: z.string().optional(),
  reasonCode: z.string().optional(),
  proofUrl: z.string().url().optional(),
  discount: z.number().optional(),
  basePrice: z.number().optional()
})

export type ExecuteTransitionDTO = z.infer<typeof ExecuteTransitionSchema>
