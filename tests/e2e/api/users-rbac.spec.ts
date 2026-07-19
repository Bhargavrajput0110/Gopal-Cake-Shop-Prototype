import { test, expect } from '@playwright/test'

test.describe('Users API - Contract, RBAC & Integrity', () => {
  const uniqueId = Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 6)
  const payload = {
    name: `Test User ${uniqueId}`,
    email: `testuser-${uniqueId}@example.com`,
    phone: `99${uniqueId.slice(-8)}`,
    role: 'SALESPERSON',
  }

  test('Sales Role - Should fail to create user (403 or 401)', async ({ request }) => {
    const res = await request.post('/api/v1/users', {
      data: payload,
      headers: { cookie: 'gopal_dummy_role=SALES' }
    })
    // 403 Forbidden because they lack MANAGE_USERS permission
    expect([401, 403]).toContain(res.status())
  })

  test('Chef Role - Should fail to create user (403 or 401)', async ({ request }) => {
    const res = await request.post('/api/v1/users', {
      data: payload,
      headers: { cookie: 'gopal_dummy_role=CHEF' }
    })
    expect([401, 403]).toContain(res.status())
  })

  test('Admin Role - Full CRUD Lifecycle', async ({ request }) => {
    const headers = { cookie: 'gopal_dummy_role=ADMIN' }
    
    // 1. CREATE (POST)
    const postRes = await request.post('/api/v1/users', {
      data: payload,
      headers
    })
    expect(postRes.status()).toBe(201) // the handler returns 201
    const createdUser = await postRes.json()
    expect(createdUser.id).toBeDefined()
    expect(createdUser.email).toBe(payload.email)
    const userId = createdUser.id

    // 2. READ (GET)
    const getRes = await request.get(`/api/v1/users`, { headers })
    expect(getRes.status()).toBe(200)
    const allUsers = await getRes.json()
    const found = allUsers.find((u: any) => u.id === userId)
    expect(found).toBeDefined()

    // 3. UPDATE (PATCH Role)
    const patchRes = await request.patch(`/api/v1/users/${userId}`, {
      data: { role: 'MANAGER' },
      headers
    })
    expect(patchRes.status()).toBe(200)
    const patchedUser = await patchRes.json()
    expect(patchedUser.role).toBe('MANAGER')

    // 4. UPDATE (PATCH Status - Deactivate/Suspend)
    const statusRes = await request.patch(`/api/v1/users/${userId}`, {
      data: { status: 'SUSPENDED' },
      headers
    })
    expect(statusRes.status()).toBe(200)
    const suspendedUser = await statusRes.json()
    expect(suspendedUser.status).toBe('SUSPENDED')
  })

  test('Validation Errors (400)', async ({ request }) => {
    const res = await request.post('/api/v1/users', {
      data: { name: 'Only Name' }, // Missing email and role
      headers: { cookie: 'gopal_dummy_role=ADMIN' }
    })
    expect(res.status()).toBe(400)
    const data = await res.json()
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})
