import { config } from 'dotenv'
config({ path: '.env.local' })

async function runTests() {
  console.log('--- Phase 3 API Integration Tests ---')

  // 1. Get Admin Session
  let adminCookie = ''
  let adminId = ''
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@gopalcakeshop.com', password: '123456' })
    })
    const data = await res.json()
    adminCookie = res.headers.get('set-cookie') || ''
    adminId = data.data.id || 'admin'
    console.log('✅ Admin logged in')
  } catch (e) {
    console.error('❌ Admin login failed', e)
    return
  }

  // 2. Test Rate Limiting
  console.log('\n--- Rate Limiting Test ---')
  let rateLimitHit = false
  for (let i = 0; i < 7; i++) {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid@test.com', password: 'wrong' })
    })
    if (res.status === 429) {
      rateLimitHit = true
    }
  }
  if (rateLimitHit) console.log('✅ Rate Limit enforced (429 Too Many Requests)')
  else console.log('⚠️ Rate Limit not hit (Check Upstash Redis config)')

  // 3. Test Branches API
  console.log('\n--- Branches API ---')
  try {
    const res = await fetch('http://localhost:3000/api/v1/branches', { headers: { cookie: adminCookie } })
    const data = await res.json()
    if (data.success && data.data.length > 0) console.log('✅ GET /api/v1/branches successful')
    else console.error('❌ Branches GET failed')
  } catch (e) { console.error(e) }

  // 4. Test Settings API
  console.log('\n--- Settings API ---')
  try {
    const res = await fetch('http://localhost:3000/api/v1/settings', { headers: { cookie: adminCookie } })
    const data = await res.json()
    if (data.success) console.log('✅ GET /api/v1/settings successful')
    else console.error('❌ Settings GET failed')

    const putRes = await fetch('http://localhost:3000/api/v1/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ key: 'STORE_STATUS', value: 'OPEN', description: 'Store operating status' })
    })
    const putData = await putRes.json()
    if (putData.success && putData.data.key === 'STORE_STATUS') console.log('✅ PUT /api/v1/settings successful')
    else console.error('❌ Settings PUT failed', putData)
  } catch (e) { console.error(e) }

  // 5. Test Customers API
  console.log('\n--- Customers API ---')
  let customerId = ''
  try {
    const createRes = await fetch('http://localhost:3000/api/v1/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ name: 'Test Customer', phone: `98765${Math.floor(Math.random() * 99999)}`, email: 'test@customer.com' })
    })
    const createData = await createRes.json()
    if (createData.success) {
      customerId = createData.data.id
      console.log('✅ POST /api/v1/customers successful')
    } else {
      console.error('❌ Customers POST failed', createData)
    }

    const listRes = await fetch('http://localhost:3000/api/v1/customers?page=1&limit=5', { headers: { cookie: adminCookie } })
    const listData = await listRes.json()
    if (listData.success && listData.pagination?.total > 0) console.log('✅ GET /api/v1/customers successful (Paginated)')
    else console.error('❌ Customers GET failed', listData)
  } catch (e) { console.error(e) }

  // 6. Test Orders API
  console.log('\n--- Orders API ---')
  let orderId = ''
  try {
    const postRes = await fetch('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        customerId,
        branchId: 'cl...', // Invalid branchId for testing zod validation
        deliveryType: 'PICKUP',
        source: 'ONLINE',
        expectedDeliveryDate: new Date().toISOString()
      })
    })
    const postData = await postRes.json()
    
    if (!postData.success) {
      console.log(`✅ Global Error Handler caught bad branch ID correctly: [${postData.code}] ${postData.message}`)
    }

    const branchesRes = await fetch('http://localhost:3000/api/v1/branches', { headers: { cookie: adminCookie } })
    const branchesData = await branchesRes.json()
    const validBranchId = branchesData.data[0].id

    const validPostRes = await fetch('http://localhost:3000/api/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        customerId,
        branchId: validBranchId,
        deliveryType: 'PICKUP',
        source: 'ONLINE',
        expectedDeliveryDate: new Date().toISOString()
      })
    })
    const validPostData = await validPostRes.json()
    if (validPostData.success) {
      orderId = validPostData.data.id
      console.log('✅ POST /api/v1/orders (Draft) successful')
    } else {
      console.error('❌ Valid Orders POST failed', validPostData)
    }

    if (orderId) {
      // Patch it
      const patchRes = await fetch(`http://localhost:3000/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', cookie: adminCookie },
        body: JSON.stringify({ notes: 'Updated notes via PATCH' })
      })
      const patchData = await patchRes.json()
      if (patchData.success && patchData.data.notes === 'Updated notes via PATCH') console.log('✅ PATCH /api/v1/orders/[id] successful')
      else console.error('❌ Orders PATCH failed', patchData)

      // Delete it
      const delRes = await fetch(`http://localhost:3000/api/v1/orders/${orderId}`, {
        method: 'DELETE',
        headers: { cookie: adminCookie }
      })
      if (delRes.status === 204) console.log('✅ DELETE /api/v1/orders/[id] successful')
      else console.error('❌ Orders DELETE failed', delRes.status)
    }

  } catch (e) { console.error(e) }

  // 7. Test Coupons API
  console.log('\n--- Coupons API ---')
  try {
    const postRes = await fetch('http://localhost:3000/api/v1/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({
        code: `TEST${Math.floor(Math.random() * 9999)}`,
        discountType: 'FLAT',
        discountValue: 100
      })
    })
    const postData = await postRes.json()
    if (postData.success) console.log('✅ POST /api/v1/coupons successful')
    else console.error('❌ Coupons POST failed', postData)

    const listRes = await fetch('http://localhost:3000/api/v1/coupons', { headers: { cookie: adminCookie } })
    const listData = await listRes.json()
    if (listData.success) console.log('✅ GET /api/v1/coupons successful')
    else console.error('❌ Coupons GET failed', listData)
  } catch (e) { console.error(e) }

  // 8. Test Notifications API
  console.log('\n--- Notifications API ---')
  try {
    const listRes = await fetch('http://localhost:3000/api/v1/notifications', { headers: { cookie: adminCookie } })
    const listData = await listRes.json()
    if (listData.success) console.log('✅ GET /api/v1/notifications successful')
    else console.error('❌ Notifications GET failed', listData)
  } catch (e) { console.error(e) }
}

runTests()
