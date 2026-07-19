import { test, expect } from '@playwright/test'

test.describe('Settings API - Behavioral Impact on Checkout', () => {
  let adminCookie = 'gopal_dummy_role=ADMIN'
  let branchId = ''
  let productId = ''

  test.beforeAll(async ({ request }) => {
    // Fetch a branch
    const branchesRes = await request.get('/api/v1/branches', { headers: { cookie: adminCookie } })
    const branchesData = await branchesRes.json()
    if (branchesData.data && branchesData.data.length > 0) {
      branchId = branchesData.data[0].id
    } else {
      // Create a branch
      const createBranch = await request.post('/api/v1/branches', {
        data: { name: 'Settings Test Branch', address: 'Test', isActive: true, city: 'Test' },
        headers: { cookie: adminCookie }
      })
      const newBranch = await createBranch.json()
      branchId = newBranch.data.id
    }

    // Fetch a product
    const productsRes = await request.get('/api/v1/products', { headers: { cookie: adminCookie } })
    const productsData = await productsRes.json()
    if (productsData.data && productsData.data.length > 0) {
      productId = productsData.data[0].id
    } else {
      const createProduct = await request.post('/api/v1/products', {
        data: { name: 'Settings Test Cake', basePrice: 500 },
        headers: { cookie: adminCookie }
      })
      const newProduct = await createProduct.json()
      productId = newProduct.data.id
    }
  })

  test('Verify GST behavioral impact on Checkout', async ({ request }) => {
    // 1. Change GST Setting to 18%
    const putRes = await request.put('/api/v1/settings', {
      data: { key: 'GST_RATE', value: '18', description: 'GST 18%' },
      headers: { cookie: adminCookie }
    })
    expect(putRes.status()).toBe(200)

    // 2. Perform Checkout
    const checkoutRes = await request.post('/api/v1/pos/checkout', {
      data: {
        branchId,
        customerId: 'walk-in',
        items: [{ productId, quantity: 1, weight: 1 }],
        paymentType: 'FULL',
        payments: [{ method: 'CASH', amount: 590 }]
      },
      headers: { cookie: adminCookie }
    })
    
    if (checkoutRes.status() !== 200) {
      console.error('GST Checkout Failed:', await checkoutRes.json())
    }
    expect(checkoutRes.status()).toBe(200)
    const data = await checkoutRes.json()
    expect(data.success).toBe(true)

    // 3. Verify via Order API
    const orderRes = await request.get(`/api/v1/orders/${data.orderId}`, {
      headers: { cookie: adminCookie }
    })
    expect(orderRes.status()).toBe(200)
    const order = (await orderRes.json()).data

    expect(Number(order.subtotal)).toBe(500)
    expect(Number(order.totalAmount)).toBe(590)
    expect(Number(order.items[0].tax)).toBe(90)
  })

  test('Verify Delivery Charges impact', async ({ request }) => {
    // 1. Change Delivery Charge Setting to 150
    const putRes = await request.put('/api/v1/settings', {
      data: { key: 'DELIVERY_CHARGE', value: '150', description: 'Default Delivery' },
      headers: { cookie: adminCookie }
    })
    expect(putRes.status()).toBe(200)

    // 2. Perform Checkout via Public Website
    const checkoutRes = await request.post('/api/v1/public/checkout', {
      data: {
        idempotencyKey: `test-del-charge-${Date.now()}`,
        customer: {
          name: 'Delivery Tester',
          phone: '9999999999'
        },
        address: {
          house: '123',
          street: 'Main St',
          area: 'Downtown',
          city: 'Test City',
          pin: '123456'
        },
        items: [{ productId, quantity: 1, weight: 1 }],
        paymentMethod: 'CASH',
        branchId,
        deliveryDate: new Date().toISOString()
      }
    })
    
    expect(checkoutRes.status()).toBe(200)
    const data = await checkoutRes.json()
    expect(data.success).toBe(true)

    // 3. Verify via Order API
    const orderRes = await request.get(`/api/v1/orders/${data.orderId}`, {
      headers: { cookie: adminCookie }
    })
    expect(orderRes.status()).toBe(200)
    const order = (await orderRes.json()).data

    expect(Number(order.subtotal)).toBe(500)
    expect(Number(order.deliveryCharge)).toBe(150)
    expect(Number(order.totalAmount)).toBe(740)
  })

  test('Verify Business Hours / Order Limits impact', async ({ request }) => {
    // 1. Set STORE_ACCEPTING_ORDERS to false
    const putRes = await request.put('/api/v1/settings', {
      data: { key: 'STORE_ACCEPTING_ORDERS', value: 'false', description: 'Store closed' },
      headers: { cookie: adminCookie }
    })
    expect(putRes.status()).toBe(200)

    try {
      // 2. Try to checkout via Public Website (Should fail)
      const checkoutRes = await request.post('/api/v1/public/checkout', {
        data: {
          idempotencyKey: `test-closed-${Date.now()}`,
          customer: { name: 'Closed Tester', phone: '9999999999' },
          address: { house: '123', street: 'St', area: 'A', city: 'C', pin: '1' },
          items: [{ productId, quantity: 1, weight: 1 }],
          paymentMethod: 'CASH',
          branchId,
          deliveryDate: new Date().toISOString()
        }
      })
      
      expect([400, 500]).toContain(checkoutRes.status())
      const data = await checkoutRes.json()
      expect(data.message || data.error || data.error?.message).toBeTruthy()
    } finally {
      // 3. Reset Setting to true
      await request.put('/api/v1/settings', {
        data: { key: 'STORE_ACCEPTING_ORDERS', value: 'true', description: 'Store open' },
        headers: { cookie: adminCookie }
      })
    }
  })
})
