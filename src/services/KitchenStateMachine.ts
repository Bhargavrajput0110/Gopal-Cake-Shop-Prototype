import { OrderItemStatus } from '@prisma/client'

export class KitchenStateMachine {
  /**
   * Validates if a transition from currentStatus to newStatus is allowed.
   */
  static validateTransition(currentStatus: OrderItemStatus, newStatus: OrderItemStatus): boolean {
    const transitions: Record<string, string[]> = {
      'PENDING': ['WAITING_FOR_CHEF'],
      'WAITING_FOR_CHEF': ['CHEF_ACCEPTED'],
      'CHEF_ACCEPTED': ['MAKING'],
      'MAKING': ['PACKED'], // Chef finishes making by packing it
    }

    const allowed = transitions[currentStatus] || []
    return allowed.includes(newStatus)
  }
}
