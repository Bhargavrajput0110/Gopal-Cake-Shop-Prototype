import { test, expect } from './fixtures/baseTest'

test.describe('Journey 4: Failed Delivery & Reassignment (@e2e)', () => {
  test('Driver marks failed, Manager reassigns, Timeline dual-driver history', async ({ page, context, checkA11y }) => {
    test.setTimeout(120000)

    // Bypass auth for admin page
    await context.addCookies([{ name: 'e2e-bypass-auth', value: 'true', domain: 'localhost', path: '/' }])

    // Mock API Data for Delivery Driver App
    await page.route(url => url.pathname.includes('/api/v1/orders') && url.searchParams.get('role') === 'driver', async (route) => {
      await route.fulfill({
        status: 200,
        json: [{
          id: 'mock-order-4',
          orderNumber: 'ORD-E2E-4',
          status: 'ON_THE_WAY',
          customer: { name: 'E2E Failed User', phone: '1111111111' },
          formattedAddress: 'Wrong Address',
          timeTarget: new Date(Date.now() + 60 * 60000).toISOString(),
          items: [{ id: 'item-1', name: 'Strawberry Cake', quantity: 1, price: 400 }]
        }]
      })
    })

    // Mock the admin orders endpoint to prevent 404 console errors during global mount
    await page.route('**/api/orders**', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          orders: [{
            id: 'mock-order-4',
            orderNumber: 'ORD-E2E-4',
            status: 'failed',
            customerName: 'E2E Failed User',
            grandTotal: 400,
            createdAt: new Date().toISOString(),
            timeTarget: new Date().toISOString(),
            isSurprise: false,
            priorityLevel: 'normal',
            items: [{ name: 'Strawberry Cake', quantity: 1 }]
          }]
        }
      })
    })

    // Mock the fail delivery endpoint
    await page.route('**/api/v1/orders/mock-order-4/actions/fail', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    // 1. Driver fails delivery
    await page.goto('/delivery')
    await expect(page).toHaveTitle(/Gopal Bakery/i)

    const activeDelivery = page.locator('div', { hasText: 'ORD-E2E-4' }).first()
    await expect(activeDelivery).toBeVisible()

    // Handle prompt for failure reason
    page.once('dialog', dialog => dialog.accept('Customer not reachable'))
    await activeDelivery.locator('button:has-text("Report Issue / Failed")').click()

    // 2. Manager reassigns

    // Mock the reassign API (which calls PATCH /api/orders/:id/status in OrderContext)
    await page.route('**/api/orders/mock-order-4/status**', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    await page.goto('/admin/orders')
    
    // Switch to List view to use row actions
    await page.locator('button:has-text("List")').click()
    const failedOrderRow = page.locator('tr', { hasText: 'E2E Failed User' }).first()
    await expect(failedOrderRow).toBeVisible()
    
    // Handle prompt for new driver ID
    page.once('dialog', dialog => dialog.accept('Driver B'))
    
    await failedOrderRow.getByRole('button', { name: 'Row actions' }).click()
    await page.locator('button', { hasText: 'Reassign' }).click()

    // 3. Verify Timeline
    // Mock tracking API
    await page.route('**/api/v1/public/orders/mock-order-4', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'mock-order-4',
          orderNumber: 'ORD-E2E-4',
          trackingId: 'mock-order-4',
          status: 'driver_assigned',
          totalAmount: 400,
          items: [{ productName: 'Strawberry Cake', quantity: 1, price: 400 }],
          timeline: [
            { status: 'failed', createdAt: new Date(Date.now() - 5000).toISOString(), note: 'Customer not reachable' },
            { status: 'driver_assigned', createdAt: new Date().toISOString(), note: 'Driver B' }
          ]
        }
      })
    })

    await page.goto('/track/mock-order-4')
    
    // Check if both timeline events exist
    await expect(page.locator('text=failed').first()).toBeVisible()
    await expect(page.locator('text=driver_assigned').first()).toBeVisible()
    
  })
})
