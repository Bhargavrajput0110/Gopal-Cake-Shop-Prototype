import { describe, it, expect } from 'vitest'
import { InventoryService } from '@/services/InventoryService'
import { InventoryMatrix } from '../matrices/InventoryMatrix'

describe('InventoryService (@unit)', () => {
  describe('Executable Inventory Matrix', () => {
    InventoryMatrix.forEach((testCase) => {
      it(testCase.scenario, () => {
        const result = InventoryService.isAvailableForSale(testCase.product, testCase.soldQuantity)
        expect(result).toBe(testCase.expected)
      })
    })
  })
})
