import { describe, it, expect, vi } from 'vitest'
import { testApi } from '../utils/api-tester'
import { GET as productsHandler } from '@/app/api/v1/public/products/route'
import { prismaTest } from '../setup/prisma-test'

vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual<any>('../setup/prisma-test')
  return { prisma: actual.prismaTest }
})

describe('Phase 2.3: API Contracts - Public Products', () => {
  it('should maintain strict backward compatibility on the Product DTO shape', async () => {
    // Mock the DB response with an exhaustive fixture
    const fixture = [{
      id: 'prod-123',
      name: 'Test Cake',
      description: 'A delicious test cake',
      price: 15.00,
      currency: 'USD',
      categoryId: 'cat-456',
      availableForSale: true,
      imageUrl: 'https://example.com/cake.jpg',
      createdAt: new Date('2026-07-01T00:00:00Z'),
      updatedAt: new Date('2026-07-01T00:00:00Z'),
      category: {
        id: 'cat-456',
        name: 'Cakes'
      }
    }]

    prismaTest.product.findMany = vi.fn().mockResolvedValue(fixture)

    const api = testApi(productsHandler)
    const res = await api.get('/api/v1/public/products')
    
    expect(res.status).toBe(200)
    
    const body = res.body
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(1)
    
    const product = body[0]
    
    // SEMANTIC SNAPSHOT: Explicit verification of the DTO contract fields
    
    // 1. Required Fields & Types
    expect(typeof product.id).toBe('string')
    expect(typeof product.name).toBe('string')
    expect(typeof product.price).toBe('number')
    expect(typeof product.availableForSale).toBe('boolean')
    
    // 2. Exact keys that frontend clients depend on
    expect(product).toHaveProperty('id')
    expect(product).toHaveProperty('name')
    expect(product).toHaveProperty('description')
    expect(product).toHaveProperty('price')
    expect(product).toHaveProperty('imageUrl')
    expect(product).toHaveProperty('categoryId')
    expect(product).toHaveProperty('category')

    // 3. Forbid leak of internal data (e.g. no tenant_id, no _internalId, etc)
    expect(product).not.toHaveProperty('tenant_id')
    expect(product).not.toHaveProperty('_internal_version')
  })
})
