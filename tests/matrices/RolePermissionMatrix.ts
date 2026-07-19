import { Role } from '@prisma/client'

export interface RolePermissionTestCase {
  role: Role
  permission: string
  expected: boolean
}

export const RolePermissionMatrix: RolePermissionTestCase[] = [
  // ADMIN
  { role: Role.ADMIN, permission: 'ORDER_VIEW', expected: true },
  { role: Role.ADMIN, permission: 'ORDER_UPDATE', expected: true },
  { role: Role.ADMIN, permission: 'ORDER_DELETE', expected: true },
  { role: Role.ADMIN, permission: 'INVENTORY_VIEW', expected: true },
  { role: Role.ADMIN, permission: 'INVENTORY_EDIT', expected: true },
  { role: Role.ADMIN, permission: 'PRICE_EDIT', expected: true },
  { role: Role.ADMIN, permission: 'REPORT_VIEW', expected: true },
  { role: Role.ADMIN, permission: 'USER_MANAGE', expected: true },
  { role: Role.ADMIN, permission: 'REFUND_PAYMENT', expected: true },

  // MANAGER
  { role: Role.MANAGER, permission: 'ORDER_VIEW', expected: true },
  { role: Role.MANAGER, permission: 'ORDER_UPDATE', expected: true },
  { role: Role.MANAGER, permission: 'ORDER_DELETE', expected: false }, // Managers can't delete orders
  { role: Role.MANAGER, permission: 'INVENTORY_VIEW', expected: true },
  { role: Role.MANAGER, permission: 'INVENTORY_EDIT', expected: true },
  { role: Role.MANAGER, permission: 'PRICE_EDIT', expected: true },
  { role: Role.MANAGER, permission: 'REPORT_VIEW', expected: true },
  { role: Role.MANAGER, permission: 'USER_MANAGE', expected: false }, // Managers can't manage users globally
  { role: Role.MANAGER, permission: 'REFUND_PAYMENT', expected: true },

  // SALESPERSON
  { role: Role.SALESPERSON, permission: 'ORDER_VIEW', expected: true },
  { role: Role.SALESPERSON, permission: 'ORDER_UPDATE', expected: true },
  { role: Role.SALESPERSON, permission: 'PRICE_EDIT', expected: false },
  { role: Role.SALESPERSON, permission: 'REFUND_PAYMENT', expected: false },
  { role: Role.SALESPERSON, permission: 'INVENTORY_EDIT', expected: false },

  // CHEF
  { role: Role.CHEF, permission: 'ORDER_VIEW', expected: true },
  { role: Role.CHEF, permission: 'ORDER_UPDATE_KITCHEN', expected: true },
  { role: Role.CHEF, permission: 'ORDER_UPDATE', expected: false },
  { role: Role.CHEF, permission: 'PRICE_EDIT', expected: false },

  // DELIVERY
  { role: Role.DELIVERY, permission: 'ORDER_VIEW', expected: true },
  { role: Role.DELIVERY, permission: 'ORDER_UPDATE_DELIVERY', expected: true },
  { role: Role.DELIVERY, permission: 'ORDER_UPDATE', expected: false },
  { role: Role.DELIVERY, permission: 'PRICE_EDIT', expected: false },

]
