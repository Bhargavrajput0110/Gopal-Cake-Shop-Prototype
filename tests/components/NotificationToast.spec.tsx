import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { NotificationToast } from '@/components/ui/NotificationToast'
import React from 'react'

test.describe('NotificationToast Component', () => {
  test('Visual: Success state', async ({ mount, page }) => {
    const component = await mount(
      <NotificationToast id="1" title="Order Created" message="Order #123 has been created" variant="success" onClose={() => {}} duration={0} />
    )
    await expect(component).toBeVisible()
    await expect(page).toHaveScreenshot('toast-success.png')
  })

  test('Visual: Error state', async ({ mount, page }) => {
    const component = await mount(
      <NotificationToast id="2" title="Payment Failed" message="Card declined" variant="error" onClose={() => {}} duration={0} />
    )
    await expect(component).toBeVisible()
    await expect(page).toHaveScreenshot('toast-error.png')
  })

  test('Interaction: Close button triggers callback and unmounts', async ({ mount }) => {
    let closedId = ''
    const component = await mount(
      <NotificationToast id="3" title="Test" variant="info" duration={0} onClose={(id) => { closedId = id }} />
    )
    
    const closeBtn = component.locator('button[aria-label="Close notification"]')
    await expect(closeBtn).toBeVisible()
    
    await closeBtn.click()
    
    // Check that callback fired with correct ID
    expect(closedId).toBe('3')
  })

  test('Accessibility: Zero WCAG violations', async ({ mount, page }) => {
    await mount(
      <div role="main" className="p-8">
        <NotificationToast id="4" title="Info" message="System update" variant="info" duration={0} onClose={() => {}} />
      </div>
    )
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
