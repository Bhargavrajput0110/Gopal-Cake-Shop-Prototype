import { test, expect } from '@playwright/test'

test.describe('Products API - Contract & RBAC Verification', () => {
  const createProductPayload = {
    name: 'RBAC Test Cake',
    description: 'A test cake',
    basePrice: 500,
  }

  test('Sales Role - Should fail to create product (401)', async ({ request }) => {
    const res = await request.post('/api/v1/products', {
      data: createProductPayload,
      headers: { cookie: 'gopal_dummy_role=SALES' }
    })
    expect(res.status()).toBe(401)
  })

  test('Chef Role - Should fail to create product (401)', async ({ request }) => {
    const res = await request.post('/api/v1/products', {
      data: createProductPayload,
      headers: { cookie: 'gopal_dummy_role=CHEF' }
    })
    expect(res.status()).toBe(401)
  })

  test('Admin Role - Full CRUD Lifecycle', async ({ request }) => {
    const headers = { cookie: 'gopal_dummy_role=ADMIN' }
    
    // 1. CREATE (POST)
    const postRes = await request.post('/api/v1/products', {
      data: createProductPayload,
      headers
    })
    const bodyStr = await postRes.text()
    if (postRes.status() !== 200) console.error("POST products error:", postRes.status(), bodyStr)
    expect(postRes.status()).toBe(200)
    const postData = JSON.parse(bodyStr)
    expect(postData.success).toBe(true)
    const productId = postData.data.id

    // 2. READ (GET)
    const getRes = await request.get(`/api/v1/products?search=RBAC`, { headers })
    expect(getRes.status()).toBe(200)
    const getData = await getRes.json()
    expect(getData.success).toBe(true)
    const foundProduct = getData.data.items.find((p: any) => p.id === productId)
    expect(foundProduct).toBeDefined()
    expect(foundProduct.name).toBe('RBAC Test Cake')

    // 3. UPDATE (PUT)
    const putRes = await request.put(`/api/v1/products/${productId}`, {
      data: { basePrice: 600 },
      headers
    })
    expect(putRes.status()).toBe(200)
    const putData = await putRes.json()
    expect(Number(putData.data.basePrice)).toBe(600)

    // 4. CLONE (POST with action=clone)
    const cloneRes = await request.post(`/api/v1/products/${productId}`, {
      data: { action: 'clone' },
      headers
    })
    expect(cloneRes.status()).toBe(200)
    const cloneData = await cloneRes.json()
    const clonedId = cloneData.data.id
    expect(cloneData.data.name).toContain('(Copy)')

    // 5. ARCHIVE / DELETE (DELETE)
    const delRes = await request.delete(`/api/v1/products/${productId}`, { headers })
    expect(delRes.status()).toBe(200)
    
    const delCloneRes = await request.delete(`/api/v1/products/${clonedId}`, { headers })
    expect(delCloneRes.status()).toBe(200)
    
    // Verify archived
    const getArchivedRes = await request.get(`/api/v1/products?isArchived=true`, { headers })
    const getArchivedData = await getArchivedRes.json()
    expect(getArchivedData.data.items.some((p: any) => p.id === productId)).toBe(true)
  })

  test('Validation Errors (400)', async ({ request }) => {
    const res = await request.post('/api/v1/products', {
      data: { basePrice: 500 }, // Missing name
      headers: { cookie: 'gopal_dummy_role=ADMIN' }
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
