import { describe, it, expect } from 'vitest'
import { AuthService } from '@/services/AuthService'
import { RolePermissionMatrix } from '../matrices/RolePermissionMatrix'

describe('AuthService (@unit)', () => {
  describe('Executable Role Permission Matrix', () => {
    RolePermissionMatrix.forEach((testCase) => {
      const testName = `Role '${testCase.role}' ${testCase.expected ? 'SHOULD' : 'SHOULD NOT'} have permission '${testCase.permission}'`

      it(testName, () => {
        const permissions = AuthService.generatePermissions(testCase.role)
        const hasPermission = permissions.includes(testCase.permission)
        expect(hasPermission).toBe(testCase.expected)
      })
    })
  })

  describe('Permission Helpers', () => {
    it('canViewOrders should return true if ORDER_VIEW is present', () => {
      expect(AuthService.canViewOrders(['ORDER_VIEW'])).toBe(true)
      expect(AuthService.canViewOrders(['OTHER_PERM'])).toBe(false)
    })

    it('canEditInventory should return true if INVENTORY_EDIT is present', () => {
      expect(AuthService.canEditInventory(['INVENTORY_EDIT'])).toBe(true)
      expect(AuthService.canEditInventory(['INVENTORY_VIEW'])).toBe(false)
    })

    it('canAssignDriver should return true if ORDER_UPDATE or ROLE_ADMIN is present', () => {
      expect(AuthService.canAssignDriver(['ORDER_UPDATE'])).toBe(true)
      expect(AuthService.canAssignDriver(['ROLE_ADMIN'])).toBe(true)
      expect(AuthService.canAssignDriver(['ORDER_VIEW'])).toBe(false)
    })

    it('canRefundPayment should return true if REFUND_PAYMENT is present', () => {
      expect(AuthService.canRefundPayment(['REFUND_PAYMENT'])).toBe(true)
      expect(AuthService.canRefundPayment(['PRICE_EDIT'])).toBe(false)
    })

    it('canManageUsers should return true if USER_MANAGE is present', () => {
      expect(AuthService.canManageUsers(['USER_MANAGE'])).toBe(true)
      expect(AuthService.canManageUsers(['ROLE_ADMIN'])).toBe(false) // Wait, ADMIN gets USER_MANAGE pushed, so the helper itself strictly looks for USER_MANAGE.
    })
  })
})
