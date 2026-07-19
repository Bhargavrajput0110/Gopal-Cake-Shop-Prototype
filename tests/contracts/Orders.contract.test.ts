import { describe, it, expect, vi } from 'vitest'
import { testApi } from '../utils/api-tester'
import { GET as ordersHandler } from '@/app/api/v1/public/orders/[trackingId]/route'
import { prismaTest } from '../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.3: API Contracts - Public Orders', () => {
  it('should maintain strict backward compatibility on the Order Tracking DTO shape', async () => {
    // Mock the DB response with an exhaustive fixture
    const mockOrder = {
      orderNumber: 'ORD-001',
      status: 'MAKING',
      targetDate: new Date('2026-07-15T12:00:00Z'),
      totalAmount: 15.00,
      items: [{
        productName: 'Cake',
        quantity: 1,
        variant: '1kg',
        image: null
      }],
      timeline: [{
        nextState: 'WAITING_FOR_CHEF',
        createdAt: new Date('2026-07-01T12:00:00Z')
      }]
    }

    prismaTest.order.findUnique = vi.fn().mockResolvedValue(mockOrder)

    const api = testApi(ordersHandler)
    const res = await api.get('/api/v1/public/orders/TRK123', {}, { trackingId: 'TRK123' })
    
    expect(res.status).toBe(200)
    
    const body = res.body
    
    // SEMANTIC SNAPSHOT: Explicit verification of the DTO contract fields
    
    // 1. Required Fields & Types
    expect(typeof body.orderNumber).toBe('string')
    expect(typeof body.status).toBe('string')
    expect(typeof body.internalStatus).toBe('string')
    expect(typeof body.totalAmount).toBe('number')
    
    // 2. Exact keys that frontend clients depend on
    expect(body).toHaveProperty('orderNumber')
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('targetDate')
    expect(body).toHaveProperty('totalAmount')
    expect(body).toHaveProperty('items')
    expect(body).toHaveProperty('timeline')
    
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items[0]).toHaveProperty('productName')
    expect(body.items[0]).toHaveProperty('quantity')
    
    // 3. Forbid leak of internal data
    expect(body).not.toHaveProperty('id')
    expect(body).not.toHaveProperty('customerId')
    expect(body).not.toHaveProperty('userId')
    expect(body).not.toHaveProperty('internalNotes') // Must never be leaked to customer!
    
    // 4. Verify Terminology Mapping logic (Contract)
    expect(body.status).toBe("We're preparing your cake")
    expect(body.internalStatus).toBe("MAKING")
  })
})
