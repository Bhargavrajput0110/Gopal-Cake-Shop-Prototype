import { z } from 'zod'

export type NotificationLogResponseDTO = {
  id: string
  orderId: string | null
  recipient: string
  channel: string
  templateName: string
  status: string
  errorMessage: string | null
  sentAt: Date | null
  createdAt: Date
}
