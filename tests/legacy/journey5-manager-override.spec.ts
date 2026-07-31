import { test, expect } from './fixtures/baseTest'

test.describe('Journey 5: Manager Override Flow (@e2e)', () => {
  test('Manager requests override, Admin approves, UI reflects approval', async ({ page, context, checkA11y }) => {
    test.setTimeout(120000)

    // Setup POS mock data so it doesn't fail on fetch
    await page.route('**/api/v1/products*', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })
    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })
    await page.route('**/api/v1/customers*', async (route) => {
      await route.fulfill({ status: 200, json: [] })
    })
    // Ensure admin orders mock is present to avoid 404 from layout fetch
    await page.route('**/api/orders**', async (route) => {
      await route.fulfill({ status: 200, json: { orders: [] } })
    })

    // 1. Manager requests override
    await page.goto('/sales/pos')
    await expect(page).toHaveTitle(/Gopal Bakery/i)

    // Clear local storage state first
    await page.evaluate(() => window.localStorage.removeItem('overrideStatus'))

    // Trigger the override prompt
    page.on('dialog', async (dialog) => {
      if (dialog.message().includes('Amount:')) {
        await dialog.accept('5000')
      } else if (dialog.message().includes('Override Required')) {
        await dialog.accept()
      } else if (dialog.message().includes('Reason:')) {
        await dialog.accept('Special VIP customer')
      }
    })

    await page.locator('button', { hasText: 'Apply Custom Discount' }).click()

    // Expect status to change to Pending Admin Approval
    await expect(page.locator('text=Pending Admin Approval')).toBeVisible()

    // 2. Admin Approves
    // Bypass auth for admin page
    await context.addCookies([{ name: 'e2e-bypass-auth', value: 'true', domain: 'localhost', path: '/' }])
    
    await page.goto('/admin/overrides')
    await expect(page.locator('text=Pending Discount Override')).toBeVisible()
    await page.locator('button', { hasText: 'Approve' }).click()
    await expect(page.locator('text=No pending overrides')).toBeVisible()

    // 3. Verify Original UI reflects approval
    await page.goto('/sales/pos')
    await expect(page.locator('text=Discount Applied')).toBeVisible()
    
    // Clear state
    await page.evaluate(() => window.localStorage.removeItem('overrideStatus'))
  })
})
