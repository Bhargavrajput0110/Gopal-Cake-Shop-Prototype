import { z } from 'zod'
import { DeliveryType } from '@prisma/client'

export const CreateDraftOrderSchema = z.object({
  customerId: z.string(),
  branchId: z.string(),
  deliveryType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']).default('PICKUP'),
  expectedDeliveryDate: z.string().datetime(),
  notes: z.string().optional(),
})

export const UpdateDraftOrderSchema = CreateDraftOrderSchema.partial()

export const PosCheckoutItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  weight: z.number().default(1),
  flavor: z.string().optional(),
  messageOnCake: z.string().optional(),
  designId: z.string().optional(),
  designCode: z.string().optional(),
  designName: z.string().optional(),
  designImageUrl: z.string().optional(),
  shape: z.string().optional(),
  notes: z.string().optional(),
  boxCount: z.number().optional(),
  estimatedPrepMinutes: z.number().optional(),
  referenceImages: z.array(z.string()).optional(),
  // Frontend might pass price for reference, but backend MUST recalculate
  frontendPrice: z.number().optional(), 
})

export const PosCheckoutPaymentSchema = z.object({
  method: z.string(), // e.g., 'CASH', 'CARD', 'UPI'
  amount: z.number().positive(),
})

export const PosCheckoutSchema = z.object({
  customerId: z.string(), // Walk-in customer ID if unassigned
  branchId: z.string().optional(), // Inferred from role, but DTO can accept it for explicit passing
  items: z.array(PosCheckoutItemSchema).min(1, 'Order must contain at least one item'),
  payments: z.array(PosCheckoutPaymentSchema).optional().default([]),
  paymentType: z.enum(['FULL', 'PARTIAL']).optional().default('FULL'),
  targetDate: z.string().optional(),
  discountCode: z.string().optional(),
  overrideDiscount: z.number().optional(),
  isPriority: z.boolean().optional(),
  notes: z.string().optional(),
})

export type CreateDraftOrderDTO = z.infer<typeof CreateDraftOrderSchema>
export type UpdateDraftOrderDTO = z.infer<typeof UpdateDraftOrderSchema>
export type PosCheckoutDTO = z.infer<typeof PosCheckoutSchema>

export type OrderResponseDTO = {
  id: string
  orderNumber?: string
  customerId: string | null
  branchId: string
  status: string
  deliveryType: string
  totalAmount: number
  expectedDeliveryDate: Date | null
  createdAt: Date
}

export type ChefProductionItemDTO = {
  id: string
  orderId: string
  orderNumber: string
  sequenceNumber: number
  status: string
  priority: number // Calculated based on targetDate and isPriority
  
  productName: string
  quantity: number
  weight: number
  flavor: string | null
  messageOnCake: string | null
  shape: string | null
  notes: string | null
  boxCount: number
  
  designId: string | null
  designName: string | null
  designCode: string | null
  designImageUrl: string | null
  referenceImages: string[]
  
  assignedChefId: string | null
  assignedChefName: string | null
  
  pauseReason: string | null
  pausedAt: Date | null
  
  estimatedPrepMinutes: number
  targetDate: Date
  createdAt: Date
  startedAt: Date | null
  
  childItems?: Array<{
    id: string
    productName: string
    status: string
    assignedVendorId: string | null
    assignedVendorName?: string | null
  }>
}

export type DriverOrderDTO = {
  id: string
  orderNumber: string
  status: string
  deliveryType: string
  targetDate: Date
  createdAt: Date
  notes: string | null

  // Task Type
  taskType?: 'CUSTOMER_DELIVERY' | 'VENDOR_PICKUP' | 'BRANCH_TRANSFER'
  pickupLocation?: string
  dropoffLocation?: string
  vendorName?: string
  

  // Delivery Specific
  assignedDriverId: string | null
  timeTarget: Date // Equivalent to promised delivery window end
  pickedUpAt: Date | null
  deliveredAt: Date | null
  
  // Payment Specific
  totalAmount: number
  paidAmount: number
  
  // Address Accuracy Rule
  formattedAddress: string | null
  coordinates: {
    lat: number
    lng: number
  } | null

  customer: {
    name: string
    phone: string
  } | null

  customerName?: string
  customerPhone?: string
  
  items: Array<{
    id: string
    quantity: number
    productName: string
    flavor: string | null
    boxCount: number
    status: string
    childItems?: Array<{ id: string, productName: string, status: string, assignedVendorId: string | null }>
  }>
}
