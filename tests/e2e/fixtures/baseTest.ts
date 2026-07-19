import { test as base } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

type BaseTestFixtures = {
  // A helper to run accessibility scans and assert zero WCAG violations
  checkA11y: () => Promise<void>
}

/**
 * Custom base test that enforces the Frontend Quality Gate for Phase 2.5:
 * 1. Zero JavaScript runtime exceptions (pageerror)
 * 2. Zero failed API requests (requestfailed) with strict allowlisting
 * 3. Zero Console errors (console.error)
 * 4. Unhandled promise rejections
 */
export const test = base.extend<BaseTestFixtures>({
  page: async ({ page }, use) => {
    const errors: string[] = []

    // 1. Catch JS exceptions and unhandled rejections
    page.on('pageerror', (err) => {
      errors.push(`[PageError] ${err.message}`)
    })

    // 2. Catch failed network requests with precise whitelisting
    page.on('requestfailed', (request) => {
      const url = request.url()
      
      // Ignore list
      if (
        url.includes('/telemetry') || 
        url.includes('favicon.ico') || 
        url.endsWith('.map') ||
        url.includes('socket.io') ||
        url.includes('__nextjs_font') ||
        request.failure()?.errorText === 'net::ERR_ABORTED'
      ) {
        return
      }
      
      // If it's a 4xx/5xx or failed request for the app itself, fail the gate.
      errors.push(`[RequestFailed] ${url} - ${request.failure()?.errorText || 'HTTP Error'}`)
    })
    
    // Also catch failed responses (500+)
    page.on('response', (response) => {
      if (response.status() >= 500) {
        const url = response.url()
        if (
          url.includes('/telemetry') || 
          url.includes('favicon.ico') || 
          url.endsWith('.map')
        ) {
          return
        }
        // 5xx means the backend crashed or misbehaved. We fail the test.
        // 4xx (401, 403, 404, 409) are valid API domain responses and should be asserted 
        // within the test logic if needed, rather than blindly failing the Quality Gate.
        errors.push(`[HTTP ${response.status()}] ${url}`)
      }
    })

    // 3. Catch console.error
    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.text()}`)
      if (msg.type() === 'error') {
        const text = msg.text()
        const url = msg.location().url;
        // WebKit logs 401s as console errors, which shouldn't fail the gate
        if (text.includes('status of 401') || text.includes('status of 403') || text.includes('status of 404')) {
          return
        }
        errors.push(`[ConsoleError] ${text} (URL: ${url})`)
      }
    })

    await use(page)

    // After the test finishes, assert that no errors were caught
    if (errors.length > 0) {
      throw new Error(`Frontend Quality Gate Failed. Found ${errors.length} errors:\n` + errors.join('\n'))
    }
  },
  
  checkA11y: async ({ page }, use) => {
    await use(async () => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .analyze()
      if (accessibilityScanResults.violations.length > 0) {
        const violations = accessibilityScanResults.violations.map(v => `${v.id}: ${v.description} (${v.nodes.length} nodes)`).join('\n')
        throw new Error(`Accessibility violations found:\n${violations}`)
      }
    })
  }
})

export { expect } from '@playwright/test'
