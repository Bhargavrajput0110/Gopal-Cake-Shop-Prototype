import { test, expect } from './fixtures/baseTest'

test.describe('Smoke Suite (@smoke)', () => {
  test('Product Catalog loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Featured Products').first()).toBeVisible()
  })

  test('Checkout page loads successfully', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.locator('text=Your Cart is Empty').first()).toBeVisible()
  })

  test('Chef Queue loads successfully', async ({ page }) => {
    await page.goto('/chef')
    // We expect it to prompt for login since it's protected, or load the dashboard if auth is mocked
    // The Quality Gate in baseTest ensures there are no JS crashes or 500s.
  })

  test('Driver Queue loads successfully', async ({ page }) => {
    await page.goto('/delivery')
  })

  test('Admin Dashboard loads successfully', async ({ page }) => {
    await page.goto('/admin')
  })

  test('Login page loads successfully', async ({ page }) => {
    await page.goto('/admin/login')
  })
})
