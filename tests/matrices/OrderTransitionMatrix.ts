import { OrderStatus, AppRole, TransitionAction, DeliveryType } from '@/lib/OrderStateMachine'

export interface StateMatrixTestCase {
  from: OrderStatus
  action: TransitionAction
  role: AppRole
  deliveryType: DeliveryType
  expected: 'SUCCESS' | 'FAILURE'
  reason?: string
}

export const OrderTransitionMatrix: StateMatrixTestCase[] = [
  // Happy Path: Full Delivery Flow
  { from: 'DRAFT', action: 'checkout', role: 'CUSTOMER', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'NEW', action: 'approve', role: 'SALESPERSON', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'WAITING_FOR_CHEF', action: 'chef-accept', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'CHEF_ACCEPTED', action: 'start-making', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'MAKING', action: 'start-decorating', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'DECORATING', action: 'ready', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'READY_FOR_PICKUP', action: 'auto-queue', role: 'ADMIN', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'PENDING_ASSIGNMENT', action: 'assign-driver', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'ASSIGNED_TO_DRIVER', action: 'pick-up', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'PICKED_UP', action: 'on-the-way', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'ON_THE_WAY', action: 'deliver', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'DELIVERED', action: 'complete', role: 'SALESPERSON', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  
  // Happy Path: Full Pickup Flow
  { from: 'DRAFT', action: 'checkout', role: 'CUSTOMER', deliveryType: 'PICKUP', expected: 'SUCCESS' },
  { from: 'DECORATING', action: 'ready', role: 'CHEF', deliveryType: 'PICKUP', expected: 'SUCCESS' },
  { from: 'READY_FOR_PICKUP', action: 'complete', role: 'SALESPERSON', deliveryType: 'PICKUP', expected: 'SUCCESS' },

  // Role Validation Failures (RBAC)
  { from: 'NEW', action: 'approve', role: 'CUSTOMER', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Permission denied' },
  { from: 'WAITING_FOR_CHEF', action: 'chef-accept', role: 'SALESPERSON', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Permission denied' },
  { from: 'PENDING_ASSIGNMENT', action: 'assign-driver', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Permission denied' },

  // State Validation Failures (Invalid Transitions)
  { from: 'NEW', action: 'deliver', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Invalid state transition' },
  { from: 'MAKING', action: 'ready', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Invalid state transition' },
  { from: 'DELIVERED', action: 'start-making', role: 'CHEF', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Invalid state transition' },
  { from: 'ASSIGNED_TO_DRIVER', action: 'assign-driver', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Invalid state transition' },
  
  // Delivery Type Mismatch Failures
  { from: 'READY_FOR_PICKUP', action: 'assign-driver', role: 'DELIVERY', deliveryType: 'PICKUP', expected: 'FAILURE', reason: 'Invalid state transition' }, // Note: assign-driver expects PENDING_ASSIGNMENT
  { from: 'PENDING_ASSIGNMENT', action: 'assign-driver', role: 'DELIVERY', deliveryType: 'PICKUP', expected: 'FAILURE', reason: 'Invalid action' },
  { from: 'ON_THE_WAY', action: 'deliver', role: 'DELIVERY', deliveryType: 'PICKUP', expected: 'FAILURE', reason: 'Invalid action' },
  
  // Cancellations
  { from: 'NEW', action: 'cancel', role: 'SALESPERSON', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
  { from: 'MAKING', action: 'cancel', role: 'SALESPERSON', deliveryType: 'DELIVERY', expected: 'FAILURE', reason: 'Invalid state transition' }, // Cannot cancel once making

  // Delivery Failures
  { from: 'ON_THE_WAY', action: 'fail-delivery', role: 'DELIVERY', deliveryType: 'DELIVERY', expected: 'SUCCESS' },
]
