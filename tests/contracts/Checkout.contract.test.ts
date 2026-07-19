import { describe, it, expect, vi } from 'vitest'
import { testApi } from '../utils/api-tester'
import { POST as checkoutHandler } from '@/app/api/v1/public/checkout/route'
import { prismaTest } from '../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.3: API Contracts - Public Checkout', () => {
  it('should maintain strict backward compatibility on the Checkout Response DTO shape', async () => {
    prismaTest.order.findUnique = vi.fn().mockResolvedValue(null)
    prismaTest.product.findUnique = vi.fn().mockResolvedValue({ id: 'prod-1', availableForSale: true, basePrice: 15, name: 'Cake' })
    prismaTest.customer.findUnique = vi.fn().mockResolvedValue(null)
    prismaTest.customer.create = vi.fn().mockResolvedValue({ id: 'cust-1' })
    prismaTest.order.count = vi.fn().mockResolvedValue(5)
    
    prismaTest.$transaction = vi.fn().mockImplementation(async (cb) => {
      const tx = {
        order: { create: vi.fn().mockResolvedValue({ id: 'order-1', trackingId: 'track-uuid' }) },
        payment: { create: vi.fn().mockResolvedValue({}) },
        timeline: { create: vi.fn().mockResolvedValue({}) },
        outbox: { create: vi.fn().mockResolvedValue({}) }
      }
      return await cb(tx)
    })

    const api = testApi(checkoutHandler)
    const validPayload = {
      idempotencyKey: 'IDEM-KEY-1234',
      customer: { name: 'Test User', phone: '1234567890' },
      address: { house: '123', street: 'Main', area: 'Downtown', city: 'City', pin: '123456' },
      items: [{ productId: 'prod-1', quantity: 2 }],
      paymentMethod: 'UPI',
      branchId: 'branch-1',
      deliveryDate: new Date().toISOString()
    }
    const res = await api.post('/api/v1/public/checkout', validPayload)
    
    expect(res.status).toBe(200)
    
    const body = res.body
    
    // SEMANTIC SNAPSHOT: Explicit verification of the DTO contract fields
    
    // 1. Required Fields & Types
    expect(typeof body.success).toBe('boolean')
    expect(typeof body.trackingId).toBe('string')
    expect(typeof body.orderId).toBe('string')
    expect(typeof body.idempotent).toBe('boolean')
    
    // 2. Exact keys that frontend clients depend on
    expect(body).toHaveProperty('success')
    expect(body).toHaveProperty('trackingId')
    expect(body).toHaveProperty('orderId')
    expect(body).toHaveProperty('idempotent')
    
    // 3. Forbid leak of internal data
    expect(body).not.toHaveProperty('customerId')
    expect(body).not.toHaveProperty('paymentStatus')
  })
})
