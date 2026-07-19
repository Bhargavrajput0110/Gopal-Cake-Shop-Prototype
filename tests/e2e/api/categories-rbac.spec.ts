import { test, expect } from '@playwright/test'

test.describe('Categories API - Contract, RBAC & Integrity', () => {
  const uniqueId = Date.now() + Math.floor(Math.random() * 1000)
  const payload = {
    name: `RBAC Category ${uniqueId}`,
    slug: `rbac-category-${uniqueId}`,
    description: 'A test category',
    displayOrder: 10,
    isActive: true
  }

  test('Sales Role - Should fail to create (401)', async ({ request }) => {
    const res = await request.post('/api/v1/categories', {
      data: payload,
      headers: { cookie: 'gopal_dummy_role=SALES' }
    })
    expect(res.status()).toBe(401)
  })

  test('Admin Role - Full CRUD Lifecycle & Integrity', async ({ request }) => {
    const headers = { cookie: 'gopal_dummy_role=ADMIN' }
    
    // 1. CREATE (POST)
    const postRes = await request.post('/api/v1/categories', {
      data: payload,
      headers
    })
    expect(postRes.status()).toBe(200)
    const postData = await postRes.json()
    expect(postData.success).toBe(true)
    const catId = postData.data.id

    // 2. READ (GET)
    const getRes = await request.get(`/api/v1/categories`, { headers })
    expect(getRes.status()).toBe(200)
    const getData = await getRes.json()
    const found = getData.find((c: any) => c.id === catId)
    expect(found).toBeDefined()
    expect(found.slug).toBe(`rbac-category-${uniqueId}`)

    // 3. UPDATE (PUT)
    const putRes = await request.put(`/api/v1/categories/${catId}`, {
      data: { name: 'Updated RBAC Category' },
      headers
    })
    expect(putRes.status()).toBe(200)

    // 4. DELETE (DELETE) - Should ensure no orphans
    const delRes = await request.delete(`/api/v1/categories/${catId}`, { headers })
    expect(delRes.status()).toBe(200)

    // Verify deletion
    const getRes2 = await request.get(`/api/v1/categories`, { headers })
    const getData2 = await getRes2.json()
    expect(getData2.find((c: any) => c.id === catId)).toBeUndefined()
  })

  test('Validation Errors (400)', async ({ request }) => {
    const res = await request.post('/api/v1/categories', {
      data: { slug: 'no-name-slug' }, // Missing name
      headers: { cookie: 'gopal_dummy_role=ADMIN' }
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
