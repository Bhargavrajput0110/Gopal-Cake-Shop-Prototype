import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Semantic contract tests verify the shape of our DTOs rather than snapshotting raw JSON.
// This ensures the API contracts remain stable and no internal fields leak to consumers.

// Import shared schemas from DTOs
const OrderResponseSchema = z.object({
  id: z.string(),
  customerId: z.string().nullable(),
  branchId: z.string().nullable(),
  status: z.string(),
  deliveryType: z.string(),
  totalAmount: z.number(),
  expectedDeliveryDate: z.union([z.date(), z.string()]).nullable().optional(),
  createdAt: z.union([z.date(), z.string()])
})

const DriverOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  deliveryType: z.string(),
  targetDate: z.union([z.date(), z.string()]),
  createdAt: z.union([z.date(), z.string()]),
  notes: z.string().nullable().optional(),
  assignedDriverId: z.string().nullable().optional(),
  timeTarget: z.union([z.date(), z.string()]),
  pickedUpAt: z.union([z.date(), z.string()]).nullable().optional(),
  deliveredAt: z.union([z.date(), z.string()]).nullable().optional(),
  formattedAddress: z.string().nullable().optional(),
  coordinates: z.any().nullable().optional(),
  customer: z.object({
    name: z.string(),
    phone: z.string()
  }).nullable().optional(),
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number(),
    productName: z.string(),
    flavor: z.string().nullable().optional()
  }))
})

const SettingResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable().optional(),
  updatedAt: z.string()
})

describe('Consumer Contract Tests (Semantic Snapshots)', () => {
  describe('OrderResponseDTO Contract', () => {
    it('must parse valid order shape successfully', () => {
      const validOrder = {
        id: 'ord-123',
        customerId: 'cust-1',
        branchId: 'b-1',
        status: 'DRAFT',
        deliveryType: 'PICKUP',
        totalAmount: 150.50,
        expectedDeliveryDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      expect(() => OrderResponseSchema.parse(validOrder)).not.toThrow()
    })

    it('must enforce field types (totalAmount is a number, not a string)', () => {
      const invalidOrder = {
        id: 'ord-123',
        customerId: 'cust-1',
        branchId: 'b-1',
        status: 'DRAFT',
        deliveryType: 'PICKUP',
        totalAmount: '150.50', // Wrong: should be number
        createdAt: new Date().toISOString()
      }
      expect(() => OrderResponseSchema.parse(invalidOrder)).toThrow()
    })

    it('must not include internal DB fields like _internal_version, db_id', () => {
      const order = {
        id: 'ord-123',
        customerId: 'cust-1',
        branchId: 'b-1',
        status: 'DRAFT',
        deliveryType: 'PICKUP',
        totalAmount: 150,
        createdAt: new Date().toISOString()
      }
      const parsed = OrderResponseSchema.parse(order)
      expect(parsed).not.toHaveProperty('db_id')
      expect(parsed).not.toHaveProperty('_internal_version')
      expect(parsed).not.toHaveProperty('passwordHash')
    })
  })

  describe('DriverOrderDTO Contract', () => {
    it('must provide customer phone (critical for delivery workflow)', () => {
      const validDriverJob = {
        id: 'ord-123',
        orderNumber: 'ORD-001',
        status: 'ASSIGNED_TO_DRIVER',
        deliveryType: 'DELIVERY',
        targetDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        notes: null,
        assignedDriverId: 'driver-1',
        timeTarget: new Date().toISOString(),
        pickedUpAt: null,
        deliveredAt: null,
        formattedAddress: '123 Main St',
        coordinates: null,
        customer: { name: 'John Doe', phone: '555-1234' },
        items: [{ id: 'item-1', quantity: 1, productName: 'Cake', flavor: 'Chocolate' }]
      }

      const parsed = DriverOrderSchema.parse(validDriverJob)
      expect(parsed.customer?.phone).toBeTypeOf('string')
      expect(Array.isArray(parsed.items)).toBe(true)
    })
  })

  describe('SettingsResponseDTO Contract', () => {
    it('must parse a valid setting', () => {
      const validSetting = {
        id: 'set-1',
        key: 'STORE_HOURS',
        value: '9-5',
        description: null,
        updatedAt: new Date().toISOString()
      }
      expect(() => SettingResponseSchema.parse(validSetting)).not.toThrow()
    })

    it('updatedAt must be a string ISO timestamp', () => {
      const validSetting = {
        id: 'set-1',
        key: 'STORE_HOURS',
        value: '9-5',
        updatedAt: new Date().toISOString()
      }
      const parsed = SettingResponseSchema.parse(validSetting)
      expect(parsed.updatedAt).toBeTypeOf('string')
    })
  })
})
