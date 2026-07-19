import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { composeStories } from '@storybook/react'
import * as OrderCardStories from '../../src/components/domain/OrderCard.stories'
import React from 'react'

// Compose the stories using Storybook's utility
const { New, Accepted, Making, Ready, Loading, UrgentSurprise } = composeStories(OrderCardStories)

test.describe('OrderCard Component (Storybook Integration)', () => {
  test('Visual: Default State (Light/Dark/Mobile/Desktop)', async ({ mount, page }) => {
    const component = await mount(<New />)
    await expect(component).toBeVisible()
    await expect(page).toHaveScreenshot('order-card-new.png')
  })

  test('Visual: Loading State', async ({ mount, page }) => {
    const component = await mount(<Loading />)
    await expect(component.locator('[data-testid="order-card-loading"]')).toBeVisible()
    await expect(page).toHaveScreenshot('order-card-loading.png')
  })

  test('Interaction: Accept button visible in NEW state', async ({ mount }) => {
    let clicked = false
    // Override the mocked onAccept from Storybook
    const component = await mount(<New onAccept={() => { clicked = true }} />)
    
    const acceptBtn = component.locator('button', { hasText: 'Accept' })
    await expect(acceptBtn).toBeVisible()
    await acceptBtn.click()
    expect(clicked).toBe(true)
  })

  test('Interaction: Ready button visible in MAKING state', async ({ mount }) => {
    const component = await mount(<Making />)
    await expect(component.locator('button', { hasText: 'Accept' })).not.toBeVisible()
    await expect(component.locator('button', { hasText: 'Ready' })).toBeVisible()
  })

  test('Interaction: Urgent & Surprise badges display correctly', async ({ mount }) => {
    const component = await mount(<UrgentSurprise />)
    await expect(component.locator('text=Surprise')).toBeVisible()
    await expect(component.locator('text=Urgent')).toBeVisible()
  })

  test('Accessibility: Zero WCAG violations', async ({ mount, page }) => {
    await mount(<New />)
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
