import { test, expect } from './fixtures/baseTest';
import { fastLogin } from './helpers/auth';

test.describe('POS Checkout Flow', () => {

  test.beforeEach(async ({ page }) => {
    await fastLogin(page, 'salesKhm');
    await page.goto('/sales');
    await page.getByRole('link', { name: 'LAUNCH POS' }).click();
    // Wait for product grid to load
    await expect(page.locator('h1', { hasText: 'Point of Sale' })).toBeVisible();
  });

  test('Golden Path Checkout', async ({ page }) => {
    // 1. Select a standard product from catalogue to open configurator
    await page.getByTestId('standard-product-card').first().click();

    // 2. Add configured item to cart
    await page.getByRole('button', { name: /Add to Cart/i }).click();

    // 3. Proceed to Checkout from Cart Panel
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();

    // 4. Confirm payment in dialog
    await page.getByRole('button', { name: /Accept ₹/i }).click();

    // 5. Verify success screen
    await expect(page.getByText('Payment Secured', { exact: false })).toBeVisible();
    await expect(page.getByText('Order #', { exact: false })).toBeVisible();
  });

  test('Double Submission (Idempotency Check)', async ({ page }) => {
    // 1. Add product and go to checkout
    await page.getByTestId('standard-product-card').first().click();
    await page.getByRole('button', { name: /Add to Cart/i }).click();
    await page.getByRole('button', { name: /Proceed to Checkout/i }).click();
    
    // 2. Double click the payment confirmation button quickly
    const confirmBtn = page.getByRole('button', { name: /Accept ₹/i });
    await confirmBtn.click();
    await confirmBtn.click({ timeout: 2000 }).catch(() => {}); // If dialog unmounts or disables button immediately, catch the timeout
    
    // 3. Verify success screen loads without duplicate order errors
    await expect(page.getByText('Payment Secured', { exact: false })).toBeVisible();
  });

  test('Empty Cart Validation', async ({ page }) => {
    // Proceed to checkout button should be disabled when cart is empty
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i });
    await expect(checkoutBtn).toBeDisabled();
  });

});

