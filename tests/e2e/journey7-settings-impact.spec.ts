import { test, expect } from './fixtures/baseTest'

test.describe('Journey 7: Settings UI to Business Impact (@e2e)', () => {
  test('Admin changes GST in UI, impacts Sales POS receipt, persists on reload', async ({ page, context }) => {
    test.setTimeout(120000)

    // 1. Log in as Admin via cookie bypass
    await context.addCookies([{ name: 'e2e-bypass-auth', value: 'true', domain: 'localhost', path: '/' }])

    // 2. Change GST from the Admin Settings UI
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')

    // Find the row with 'GST_RATE'
    const gstRow = page.locator('tr').filter({ hasText: 'GST_RATE' })
    await expect(gstRow).toBeVisible()

    // Click the Row actions dropdown on that row
    await gstRow.getByRole('button', { name: 'Row actions' }).click()

    // Click Edit on that row
    await page.getByRole('button', { name: 'Edit' }).click()

    // The modal should open
    await expect(page.locator('h2', { hasText: 'Edit Setting' })).toBeVisible()

    // Change value to 25
    await page.locator('textarea[placeholder="Configuration value"]').fill('25')
    
    // Save
    await page.getByRole('button', { name: 'Save Setting' }).click()
    
    // Wait for the modal to close and the row to reflect the new value
    await expect(page.locator('h2', { hasText: 'Edit Setting' })).toBeHidden()
    await expect(gstRow.getByText('25', { exact: true }).first()).toBeVisible()

    // 3. Open Sales POS
    await page.goto('/sales/pos')
    await page.waitForLoadState('networkidle')

    // Add a product (Pineapple Cake - assuming it's seeded or fetched)
    // We will pick the first product available in the grid
    const firstProductBtn = page.locator('.grid button').first()
    await expect(firstProductBtn).toBeVisible()
    await firstProductBtn.click()

    // Proceed to Checkout
    await page.locator('button', { hasText: 'Proceed to Checkout' }).click()

    // Payment Dialog should show up
    await expect(page.locator('h2:has-text("Payment")')).toBeVisible()

    // Get the total amount shown in checkout to verify it uses the new GST later
    // Wait for the dialog to settle
    await page.waitForTimeout(500)

    // Complete the payment
    await page.locator('button:has-text("Cash")').click()
    
    // Check for Pay button (matches "Pay ₹...")
    const payBtn = page.locator('button', { hasText: /Pay ₹/ })
    await payBtn.click()

    // Expect Success
    await expect(page.locator('text=Order Completed!')).toBeVisible()

    // 4. Print/view the receipt and confirm GST is correct
    // The receipt is in the DOM (hidden except when printing), so we can just check it directly

    // In ReceiptStub, Tax is computed as totalAmount - subtotal + discount
    const taxRow = page.locator('div.flex.justify-between:has(span:text-is("Tax"))').first()
    await expect(taxRow).toBeAttached()
    
    const taxAmountText = await taxRow.locator('span').nth(1).textContent() || '0'
    const taxAmount = parseFloat(taxAmountText)

    const subtotalRow = page.locator('div.flex.justify-between:has(span:text-is("Subtotal"))').first()
    const subtotalText = await subtotalRow.locator('span').nth(1).textContent() || '0'
    const subtotalAmount = parseFloat(subtotalText)

    // The tax should be exactly 25% of subtotal
    const expectedTax = (subtotalAmount * 0.25).toFixed(2)
    expect(taxAmount.toFixed(2)).toBe(expectedTax)

    // 5. Reload the application and verify the setting persists
    await page.goto('/admin/settings')
    await page.waitForLoadState('networkidle')
    const reloadedGstRow = page.locator('tr').filter({ hasText: 'GST_RATE' })
    await expect(reloadedGstRow).toBeVisible()
    await expect(reloadedGstRow.getByText('25', { exact: true }).first()).toBeVisible()

    // Teardown: Reset GST back to 18 so it doesn't break other tests
    await reloadedGstRow.getByRole('button', { name: 'Row actions' }).click()
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.locator('textarea[placeholder="Configuration value"]').fill('18')
    await page.getByRole('button', { name: 'Save Setting' }).click()
    await expect(page.locator('h2', { hasText: 'Edit Setting' })).toBeHidden()
  })
})
