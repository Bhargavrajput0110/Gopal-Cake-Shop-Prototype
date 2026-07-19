import { prisma } from '../src/lib/prisma'

async function testTransition(orderId: string, action: string, body: any, cookie: string) {
  const res = await fetch(`http://localhost:3000/api/v1/orders/${orderId}/actions/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie
    },
    body: JSON.stringify(body)
  })
  
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`[${res.status}] Action ${action} failed: ${data.message || JSON.stringify(data)}`)
  }
  return data
}

async function login(email: string, password: string = '123456') {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error(`Login failed for ${email}`)
  return setCookie
}

async function main() {
  console.log('--- Phase 4: Workflow Integration Tests ---')

  const adminCookie = await login('admin@gopalcakeshop.com')
  const salesCookie = await login('sales@gopalcakeshop.com')
  const chefCookie = await login('chef@gopalcakeshop.com')
  const driverCookie = await login('driver@gopalcakeshop.com')
  const managerCookie = await login('manager@gopalcakeshop.com')
  
  // Clean up previous test orders if needed, or create new ones
  const umaBranch = await prisma.branch.findFirst({ where: { name: 'Uma Branch' } })
  const customer = await prisma.customer.findFirst({ where: { phone: '9998887776' } })
  
  if (!umaBranch || !customer) throw new Error('Seed data missing')

  // --- Test Delivery Workflow ---
  console.log('\nTesting Delivery Workflow...')
  const delOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-DEL-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'DRAFT',
      deliveryType: 'DELIVERY',
      targetDate: new Date(),
      subtotal: 500,
      totalAmount: 500
    }
  })
  const dId = delOrder.id
  
  try {
    await testTransition(dId, 'checkout', {}, salesCookie)
    await testTransition(dId, 'approve', {}, managerCookie)
    await testTransition(dId, 'chef-accept', {}, chefCookie)
    
    // Concurrency test: Try chef-accept again
    try {
      await testTransition(dId, 'chef-accept', {}, chefCookie)
      console.error('❌ Concurrency check failed! Second chef-accept should fail.')
    } catch (e: any) {
      if (e.message.includes('409') || e.message.includes('Invalid state transition')) {
        console.log('✅ Concurrency check passed (second accept blocked)')
      } else {
        throw e
      }
    }
    
    await testTransition(dId, 'start-making', {}, chefCookie)
    await testTransition(dId, 'start-decorating', {}, chefCookie)
    
    // Check auto-queue
    await testTransition(dId, 'ready', {}, chefCookie)
    const afterReady = await prisma.order.findUnique({ where: { id: dId } })
    if (afterReady?.status !== 'PENDING_ASSIGNMENT') {
      throw new Error(`Expected PENDING_ASSIGNMENT due to auto-queue, got ${afterReady?.status}`)
    }
    console.log('✅ Auto-queue to PENDING_ASSIGNMENT successful')

    await testTransition(dId, 'assign-driver', {}, driverCookie)
    await testTransition(dId, 'pick-up', {}, driverCookie)
    await testTransition(dId, 'on-the-way', {}, driverCookie)
    await testTransition(dId, 'deliver', {}, driverCookie)
    await testTransition(dId, 'complete', {}, managerCookie)
    console.log('✅ Delivery Workflow Passed')

    const timelines = await prisma.timeline.count({ where: { orderId: dId } })
    console.log(`✅ Generated ${timelines} timeline events for Delivery order`)
  } catch (e) {
    console.error('❌ Delivery Workflow Failed:', e)
  }

  // --- Test Pickup Workflow ---
  console.log('\nTesting Pickup Workflow...')
  const pickOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-PIC-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'DRAFT',
      deliveryType: 'PICKUP',
      targetDate: new Date(),
      subtotal: 500,
      totalAmount: 500
    }
  })
  const pId = pickOrder.id

  try {
    await testTransition(pId, 'checkout', {}, salesCookie)
    await testTransition(pId, 'approve', {}, salesCookie)
    await testTransition(pId, 'chef-accept', {}, chefCookie)
    await testTransition(pId, 'start-making', {}, chefCookie)
    await testTransition(pId, 'start-decorating', {}, chefCookie)
    
    // Should NOT auto-queue for pickup
    await testTransition(pId, 'ready', {}, chefCookie)
    const afterPickReady = await prisma.order.findUnique({ where: { id: pId } })
    if (afterPickReady?.status !== 'READY_FOR_PICKUP') {
      throw new Error(`Expected READY_FOR_PICKUP for pickup order, got ${afterPickReady?.status}`)
    }
    console.log('✅ Pickup order correctly bypassed PENDING_ASSIGNMENT')

    await testTransition(pId, 'complete', {}, salesCookie)
    console.log('✅ Pickup Workflow Passed')
  } catch (e) {
    console.error('❌ Pickup Workflow Failed:', e)
  }

  // --- Test Failed Delivery & Cancel ---
  console.log('\nTesting Failure & Cancel Workflows...')
  const failOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-FAIL-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'DRAFT',
      deliveryType: 'DELIVERY',
      targetDate: new Date(),
      subtotal: 500,
      totalAmount: 500
    }
  })
  const fId = failOrder.id
  
  try {
    await testTransition(fId, 'checkout', {}, salesCookie)
    // Cancel from NEW
    await testTransition(fId, 'cancel', { note: 'Customer requested cancellation' }, managerCookie)
    console.log('✅ Cancel Workflow Passed')
  } catch (e) {
    console.error('❌ Cancel Workflow Failed:', e)
  }

  console.log('\nTesting Idempotency & Concurrency (Duplicate Requests)...')
  
  // Create test order for concurrency test
  const concOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-CONC-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'NEW',
      deliveryType: 'PICKUP',
      targetDate: new Date(),
      subtotal: 300,
      totalAmount: 300,
    }
  })

  // Fire two simultaneous requests
  const [res1, res2] = await Promise.all([
    fetch(`http://localhost:3000/api/v1/orders/${concOrder.id}/actions/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: managerCookie },
      body: JSON.stringify({ action: 'approve' })
    }),
    fetch(`http://localhost:3000/api/v1/orders/${concOrder.id}/actions/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: managerCookie },
      body: JSON.stringify({ action: 'approve' })
    })
  ])

  const statusList = [res1.status, res2.status].sort()
  if (statusList[0] === 200 && statusList[1] === 409) {
    console.log('✅ Idempotency test passed (Only first succeeded, second blocked by CONFLICT)')
  } else {
    console.error(`❌ Idempotency test failed. Expected [200, 409], got [${statusList}]`)
    throw new Error('Idempotency test failed')
  }

  // Double delivery test
  const driverUser = await prisma.user.findFirst({ where: { role: 'DELIVERY' } })
  const del2Order = await prisma.order.create({
    data: {
      orderNumber: `TEST-DEL2-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'ON_THE_WAY',
      deliveryType: 'DELIVERY',
      driverId: driverUser!.id,
      targetDate: new Date(),
      subtotal: 500,
      totalAmount: 500,
    }
  })

  // First delivery request
  const del1 = await fetch(`http://localhost:3000/api/v1/orders/${del2Order.id}/actions/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: driverCookie },
    body: JSON.stringify({ action: 'deliver' })
  })
  
  // Second delivery request
  const del2 = await fetch(`http://localhost:3000/api/v1/orders/${del2Order.id}/actions/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: driverCookie },
    body: JSON.stringify({ action: 'deliver' })
  })

  if (del1.status === 200 && del2.status === 409) {
    console.log('✅ Double delivery test passed (Second request rejected with 409 CONFLICT)')
  } else {
    console.error(`❌ Double delivery test failed. Res1: ${del1.status}, Res2: ${del2.status}`)
    throw new Error('Double delivery test failed')
  }

  // 1. Browser refresh (Chef clicks accept, browser refreshes, retries)
  const chefOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-CHEF-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'WAITING_FOR_CHEF',
      deliveryType: 'PICKUP',
      targetDate: new Date(),
      subtotal: 100,
      totalAmount: 100,
    }
  })
  
  const [chefRes1, chefRes2] = await Promise.all([
    fetch(`http://localhost:3000/api/v1/orders/${chefOrder.id}/actions/chef-accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: chefCookie },
      body: JSON.stringify({ action: 'chef-accept' })
    }),
    fetch(`http://localhost:3000/api/v1/orders/${chefOrder.id}/actions/chef-accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: chefCookie },
      body: JSON.stringify({ action: 'chef-accept' })
    })
  ])
  
  const chefStatuses = [chefRes1.status, chefRes2.status].sort()
  if (chefStatuses[0] === 200 && chefStatuses[1] === 409) {
    console.log('✅ Browser refresh / Mobile retry test passed (Only one Chef accept succeeded)')
  } else {
    throw new Error('Browser refresh test failed')
  }

  // 3. Two Admins competing
  const adminOrder = await prisma.order.create({
    data: {
      orderNumber: `TEST-ADMIN-${Date.now()}`,
      customerId: customer.id,
      branchId: umaBranch.id,
      status: 'WAITING_FOR_CHEF',
      deliveryType: 'PICKUP',
      targetDate: new Date(),
      subtotal: 100,
      totalAmount: 100,
    }
  })

  const [adminA, adminB] = await Promise.all([
    fetch(`http://localhost:3000/api/v1/orders/${adminOrder.id}/actions/chef-accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'chef-accept' })
    }),
    fetch(`http://localhost:3000/api/v1/orders/${adminOrder.id}/actions/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: adminCookie },
      body: JSON.stringify({ action: 'cancel', note: 'Customer called', reasonCode: 'CUSTOMER_CANCELLED' })
    })
  ])

  const adminStatuses = [adminA.status, adminB.status].sort()
  // One should be 200, one should be 409
  if (adminStatuses[0] === 200 && adminStatuses[1] === 409) {
    console.log('✅ Competing Admins test passed (Only one admin action succeeded, other was 409)')
  } else {
    throw new Error(`Competing Admins test failed. Res A: ${adminA.status}, Res B: ${adminB.status}`)
  }

  console.log('\n--- All Workflows Passed ---')
}

main().catch(console.error).finally(() => prisma.$disconnect())
