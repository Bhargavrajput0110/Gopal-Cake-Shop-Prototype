import { test, expect } from '@playwright/experimental-ct-react'
import AxeBuilder from '@axe-core/playwright'
import { ProductCard } from '@/components/domain/ProductCard'
import React from 'react'

const mockProduct = {
  id: 1,
  title: 'Chocolate Truffle Cake',
  category: 'Signature',
  price: '₹650',
  image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop',
}

test.describe('ProductCard Component', () => {
  test('Visual: Default State (Responsive across projects)', async ({ mount, page }) => {
    const component = await mount(<ProductCard {...mockProduct} />)
    await expect(component).toBeVisible()
    
    // Playwright automatically scopes the snapshot name by project (e.g. chromium, Mobile Safari)
    await expect(page).toHaveScreenshot('product-card-default.png')
  })

  test('Visual: With Badges and Original Price', async ({ mount, page }) => {
    const component = await mount(
      <ProductCard 
        {...mockProduct} 
        isNew={true} 
        discountBadge="10% OFF" 
        originalPrice="₹750" 
      />
    )
    
    await expect(component.locator('text=New')).toBeVisible()
    await expect(component.locator('text=10% OFF')).toBeVisible()
    await expect(component.locator('text=₹750')).toBeVisible()
    await expect(page).toHaveScreenshot('product-card-badges.png')
  })

  test('Interaction: Quick View overlay appears on hover', async ({ mount, page, isMobile }) => {
    test.skip(isMobile, 'Hover interactions are not applicable on mobile viewports')
    
    let clicked = false
    const component = await mount(
      <ProductCard {...mockProduct} onQuickView={() => { clicked = true }} />
    )
    
    const quickViewBtn = component.locator('button:has-text("Quick View")')
    
    // Quick View should not be visible or interactable initially
    // Playwright `hover` forces layout evaluation
    await component.hover()
    
    // Wait for transition (the button is translated into view via group-hover:translate-y-0)
    await expect(quickViewBtn).toBeVisible()
    await quickViewBtn.click()
    
    expect(clicked).toBe(true)
  })

  test('Accessibility: Zero WCAG violations', async ({ mount, page }) => {
    await mount(
      <div role="main">
        <ProductCard {...mockProduct} discountBadge="Sale" />
      </div>
    )
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
