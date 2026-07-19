import { Role } from '@prisma/client'

export const PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_BRANCHES: 'manage_branches',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_REPORTS: 'manage_reports',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_COUPONS: 'manage_coupons',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_CUSTOMERS: 'manage_customers',
  MANAGE_NOTIFICATIONS: 'manage_notifications',
  VIEW_ORDERS: 'view_orders',
  UPDATE_ORDER_FULL: 'update_order_full',
  UPDATE_ORDER_CHEF: 'update_order_chef',
  UPDATE_ORDER_DRIVER: 'update_order_driver',
} as const

export type Capability = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export type Scope = 'G' | 'B' | '❌'

// Maps Role -> Capability -> Scope
const RBAC_MATRIX: Record<Role, Record<Capability, Scope>> = {
  ADMIN: {
    [PERMISSIONS.MANAGE_USERS]: 'G',
    [PERMISSIONS.MANAGE_ROLES]: 'G',
    [PERMISSIONS.MANAGE_BRANCHES]: 'G',
    [PERMISSIONS.MANAGE_SETTINGS]: 'G',
    [PERMISSIONS.MANAGE_REPORTS]: 'G',
    [PERMISSIONS.MANAGE_PRODUCTS]: 'G',
    [PERMISSIONS.MANAGE_CATEGORIES]: 'G',
    [PERMISSIONS.MANAGE_COUPONS]: 'G',
    [PERMISSIONS.MANAGE_INVENTORY]: 'G',
    [PERMISSIONS.MANAGE_CUSTOMERS]: 'G',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'G',
    [PERMISSIONS.VIEW_ORDERS]: 'G',
    [PERMISSIONS.UPDATE_ORDER_FULL]: 'G',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: 'G',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: 'G',
  },
  MANAGER: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: 'B',
    [PERMISSIONS.MANAGE_PRODUCTS]: 'G',
    [PERMISSIONS.MANAGE_CATEGORIES]: 'G',
    [PERMISSIONS.MANAGE_COUPONS]: 'B',
    [PERMISSIONS.MANAGE_INVENTORY]: 'B',
    [PERMISSIONS.MANAGE_CUSTOMERS]: 'B',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'B',
    [PERMISSIONS.VIEW_ORDERS]: 'B',
    [PERMISSIONS.UPDATE_ORDER_FULL]: 'B',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: 'B',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: 'B',
  },
  SALESPERSON: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: '❌',
    [PERMISSIONS.MANAGE_CUSTOMERS]: 'B',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'B',
    [PERMISSIONS.VIEW_ORDERS]: 'B',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: '❌',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: '❌',
  },
  CHEF: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: 'B',
    [PERMISSIONS.MANAGE_CUSTOMERS]: '❌',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'B',
    [PERMISSIONS.VIEW_ORDERS]: 'B',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: 'B',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: '❌',
  },
  DELIVERY: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: '❌',
    [PERMISSIONS.MANAGE_CUSTOMERS]: '❌',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: 'B',
    [PERMISSIONS.VIEW_ORDERS]: 'B',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: '❌',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: 'B',
  },
  VENDOR_FLORIST: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: '❌',
    [PERMISSIONS.MANAGE_CUSTOMERS]: '❌',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: '❌',
    [PERMISSIONS.VIEW_ORDERS]: '❌',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: '❌',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: '❌',
  },
  VENDOR_PHOTO: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: '❌',
    [PERMISSIONS.MANAGE_CUSTOMERS]: '❌',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: '❌',
    [PERMISSIONS.VIEW_ORDERS]: '❌',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: '❌',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: '❌',
  },
  VENDOR_ACRYLIC: {
    [PERMISSIONS.MANAGE_USERS]: '❌',
    [PERMISSIONS.MANAGE_ROLES]: '❌',
    [PERMISSIONS.MANAGE_BRANCHES]: '❌',
    [PERMISSIONS.MANAGE_SETTINGS]: '❌',
    [PERMISSIONS.MANAGE_REPORTS]: '❌',
    [PERMISSIONS.MANAGE_PRODUCTS]: '❌',
    [PERMISSIONS.MANAGE_CATEGORIES]: '❌',
    [PERMISSIONS.MANAGE_COUPONS]: '❌',
    [PERMISSIONS.MANAGE_INVENTORY]: '❌',
    [PERMISSIONS.MANAGE_CUSTOMERS]: '❌',
    [PERMISSIONS.MANAGE_NOTIFICATIONS]: '❌',
    [PERMISSIONS.VIEW_ORDERS]: '❌',
    [PERMISSIONS.UPDATE_ORDER_FULL]: '❌',
    [PERMISSIONS.UPDATE_ORDER_CHEF]: '❌',
    [PERMISSIONS.UPDATE_ORDER_DRIVER]: '❌',
  }
}

/**
 * Evaluates whether a user can perform an action based on their effective permissions and scope.
 */
export function hasPermission(
  userRole: Role, 
  userBranchId: string | null, 
  capability: Capability, 
  contextBranchId?: string | null
): boolean {
  // 1. Get user's default permission set from Role
  const permissionSet = RBAC_MATRIX[userRole]
  if (!permissionSet) return false // Failsafe

  // 2. Extract specific capability scope
  const scope = permissionSet[capability]

  // 3. Evaluate scope
  if (scope === '❌') {
    return false
  }

  if (scope === 'G') {
    return true // Global access
  }

  if (scope === 'B') {
    // Fail-Safe Branch Rule: If scope is branch but user has no branch, DENY.
    if (!userBranchId) {
      return false
    }

    // If context was provided, user must match the context branch
    if (contextBranchId && userBranchId !== contextBranchId) {
      return false
    }

    // If no context provided, they generally have the capability within *their* branch
    // The consumer is responsible for applying the branch filter in database queries
    return true
  }

  return false
}
