export interface InventoryTestCase {
  scenario: string
  product: {
    status: string
    availableForSale: boolean
    productionLimit: number | null
  }
  soldQuantity: number
  expected: boolean
}

export const InventoryMatrix: InventoryTestCase[] = [
  // Happy Path
  { scenario: 'Product active, no limit', product: { status: 'active', availableForSale: true, productionLimit: null }, soldQuantity: 100, expected: true },
  
  // Status boundaries
  { scenario: 'Product archived', product: { status: 'archived', availableForSale: true, productionLimit: null }, soldQuantity: 0, expected: false },
  { scenario: 'Product draft', product: { status: 'draft', availableForSale: true, productionLimit: null }, soldQuantity: 0, expected: false },
  
  // Manual Overrides
  { scenario: 'Product manually disabled', product: { status: 'active', availableForSale: false, productionLimit: null }, soldQuantity: 0, expected: false },
  
  // Production limits boundaries
  { scenario: 'Limit = 0, sold = 0', product: { status: 'active', availableForSale: true, productionLimit: 0 }, soldQuantity: 0, expected: false },
  { scenario: 'Limit = 1, sold = 0 (Limit not reached)', product: { status: 'active', availableForSale: true, productionLimit: 1 }, soldQuantity: 0, expected: true },
  { scenario: 'Limit = 1, sold = 1 (Limit exactly reached)', product: { status: 'active', availableForSale: true, productionLimit: 1 }, soldQuantity: 1, expected: false },
  { scenario: 'Limit = 10, sold = 11 (Limit exceeded)', product: { status: 'active', availableForSale: true, productionLimit: 10 }, soldQuantity: 11, expected: false },
  { scenario: 'Limit = null (Unlimited production)', product: { status: 'active', availableForSale: true, productionLimit: null }, soldQuantity: 9999, expected: true },
  { scenario: 'Negative values rejected', product: { status: 'active', availableForSale: true, productionLimit: -5 }, soldQuantity: 0, expected: false },
]
