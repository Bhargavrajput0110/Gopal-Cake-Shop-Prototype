import { test, expect } from '@playwright/test'

test.describe('Designs API - Contract, RBAC & Integrity', () => {
  const uniqueId = Date.now() + '-' + Math.random().toString(36).substring(7)
  const payload = {
    code: `DSG-${uniqueId}`,
    name: `RBAC Design ${uniqueId}`,
    description: 'A test design',
    imageUrl: 'https://example.com/image.jpg',
    status: 'ACTIVE'
  }

  test('Sales Role - Should fail to create (401)', async ({ request }) => {
    const res = await request.post('/api/v1/designs', {
      data: payload,
      headers: { cookie: 'gopal_dummy_role=SALES' }
    })
    expect(res.status()).toBe(401)
  })

  test('Chef Role - Should fail to create (401)', async ({ request }) => {
    const res = await request.post('/api/v1/designs', {
      data: payload,
      headers: { cookie: 'gopal_dummy_role=CHEF' }
    })
    expect(res.status()).toBe(401)
  })

  test('Admin Role - Full CRUD Lifecycle & Integrity', async ({ request }) => {
    const headers = { cookie: 'gopal_dummy_role=ADMIN' }
    
    // 1. CREATE (POST)
    const postRes = await request.post('/api/v1/designs', {
      data: payload,
      headers
    })
    expect(postRes.status()).toBe(200)
    const postData = await postRes.json()
    expect(postData.success).toBe(true)
    const designId = postData.data.id

    // 2. READ (GET)
    const getRes = await request.get(`/api/v1/designs?search=${uniqueId}`, { headers })
    expect(getRes.status()).toBe(200)
    const getData = await getRes.json()
    const found = getData.data.items.find((d: any) => d.id === designId)
    expect(found).toBeDefined()
    expect(found.code).toBe(`DSG-${uniqueId}`)

    // 3. UPDATE (PUT)
    const putRes = await request.put(`/api/v1/designs/${designId}`, {
      data: { name: 'Updated RBAC Design' },
      headers
    })
    expect(putRes.status()).toBe(200)

    // 4. DELETE (DELETE) - Ensure no orphans
    const delRes = await request.delete(`/api/v1/designs/${designId}`, { headers })
    expect(delRes.status()).toBe(200)

    // Verify deletion
    const getRes2 = await request.get(`/api/v1/designs?search=${uniqueId}`, { headers })
    const getData2 = await getRes2.json()
    expect(getData2.data.items.find((d: any) => d.id === designId)).toBeUndefined()
  })

  test('Validation Errors (400)', async ({ request }) => {
    const res = await request.post('/api/v1/designs', {
      data: { name: 'Missing Code and ImageUrl' }, // Missing code, imageUrl
      headers: { cookie: 'gopal_dummy_role=ADMIN' }
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
