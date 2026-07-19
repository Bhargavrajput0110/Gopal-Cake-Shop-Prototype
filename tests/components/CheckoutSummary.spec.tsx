import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { CheckoutSummary } from '@/components/domain/CheckoutSummary'
import React from 'react'

const mockProps = {
  name: 'Test User',
  house: 'A-1',
  area: 'Sector 5',
  city: 'Gurgaon',
  paymentMethod: 'CASH',
  subtotal: 1250
}

test.describe('CheckoutSummary Component', () => {
  test('Visual: Populated State', async ({ mount, page }) => {
    const component = await mount(<CheckoutSummary {...mockProps} />)
    await expect(component).toBeVisible()
    await expect(page).toHaveScreenshot('checkout-summary-populated.png')
  })

  test('Visual: Empty State (Missing Address)', async ({ mount, page }) => {
    const component = await mount(<CheckoutSummary {...mockProps} house="" area="" />)
    await expect(component.locator('text=Gurgaon')).toBeVisible()
    await expect(page).toHaveScreenshot('checkout-summary-empty-address.png')
  })

  test('Accessibility: Zero WCAG violations', async ({ mount, page }) => {
    await mount(
      <div role="main">
        <CheckoutSummary {...mockProps} />
      </div>
    )
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
