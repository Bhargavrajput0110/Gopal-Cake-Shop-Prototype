export type OrderStatus =
  | 'DRAFT'
  | 'NEW'
  | 'WAITING_FOR_CHEF'
  | 'CHEF_ACCEPTED'
  | 'MAKING'
  | 'DECORATING'
  | 'READY_FOR_PICKUP'
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED_TO_DRIVER'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'

export type AppRole = 'CUSTOMER' | 'SALESPERSON' | 'CHEF' | 'DELIVERY' | 'MANAGER' | 'ADMIN'

export type DeliveryType = 'DELIVERY' | 'PICKUP'

export type TransitionAction =
  | 'checkout'
  | 'approve'
  | 'chef-accept'
  | 'start-making'
  | 'start-decorating'
  | 'ready'
  | 'assign-driver'
  | 'pick-up'
  | 'on-the-way'
  | 'deliver'
  | 'fail-delivery'
  | 'complete'
  | 'cancel'
  | 'auto-queue'

export type TransitionConfig = {
  action: TransitionAction
  current: OrderStatus | OrderStatus[]
  next: OrderStatus
  roles: AppRole[]
  requireReason?: boolean
  allowedDeliveryTypes?: DeliveryType[]
}

export const STATE_MACHINE: TransitionConfig[] = [
  { action: 'checkout', current: 'DRAFT', next: 'NEW', roles: ['CUSTOMER', 'SALESPERSON', 'MANAGER'] },
  { action: 'approve', current: 'NEW', next: 'WAITING_FOR_CHEF', roles: ['SALESPERSON', 'MANAGER', 'ADMIN'] },
  { action: 'chef-accept', current: 'WAITING_FOR_CHEF', next: 'CHEF_ACCEPTED', roles: ['CHEF', 'ADMIN'] },
  { action: 'start-making', current: 'CHEF_ACCEPTED', next: 'MAKING', roles: ['CHEF', 'ADMIN'] },
  { action: 'start-decorating', current: 'MAKING', next: 'DECORATING', roles: ['CHEF', 'ADMIN'] },
  { action: 'ready', current: 'DECORATING', next: 'READY_FOR_PICKUP', roles: ['CHEF', 'ADMIN'] },
  
  // Delivery Flow
  { action: 'auto-queue', current: 'READY_FOR_PICKUP', next: 'PENDING_ASSIGNMENT', roles: ['ADMIN'], allowedDeliveryTypes: ['DELIVERY'] }, // System internal action
  { action: 'assign-driver', current: 'PENDING_ASSIGNMENT', next: 'ASSIGNED_TO_DRIVER', roles: ['DELIVERY', 'ADMIN'], allowedDeliveryTypes: ['DELIVERY'] },
  { action: 'pick-up', current: 'ASSIGNED_TO_DRIVER', next: 'PICKED_UP', roles: ['DELIVERY', 'ADMIN'], allowedDeliveryTypes: ['DELIVERY'] },
  { action: 'on-the-way', current: 'PICKED_UP', next: 'ON_THE_WAY', roles: ['DELIVERY', 'ADMIN'], allowedDeliveryTypes: ['DELIVERY'] },
  { action: 'deliver', current: 'ON_THE_WAY', next: 'DELIVERED', roles: ['DELIVERY', 'ADMIN'], allowedDeliveryTypes: ['DELIVERY'] },
  { action: 'fail-delivery', current: ['PICKED_UP', 'ON_THE_WAY'], next: 'FAILED_DELIVERY', roles: ['DELIVERY', 'ADMIN'], requireReason: true, allowedDeliveryTypes: ['DELIVERY'] },
  { action: 'complete', current: 'DELIVERED', next: 'COMPLETED', roles: ['SALESPERSON', 'MANAGER', 'ADMIN'], allowedDeliveryTypes: ['DELIVERY'] }, // System will also trigger this if automated
  
  // Failure Recovery
  { action: 'assign-driver', current: 'FAILED_DELIVERY', next: 'ASSIGNED_TO_DRIVER', roles: ['DELIVERY', 'ADMIN', 'MANAGER', 'SALESPERSON'], allowedDeliveryTypes: ['DELIVERY'] },

  // Pickup Flow
  { action: 'complete', current: 'READY_FOR_PICKUP', next: 'COMPLETED', roles: ['SALESPERSON', 'MANAGER', 'ADMIN'], allowedDeliveryTypes: ['PICKUP'] },
  
  // Cancellation Flow
  { action: 'cancel', current: ['NEW', 'WAITING_FOR_CHEF', 'READY_FOR_PICKUP'], next: 'CANCELLED', roles: ['SALESPERSON', 'MANAGER', 'ADMIN'], requireReason: true },
]

export class OrderStateMachine {
  static validate(
    action: TransitionAction,
    currentState: OrderStatus,
    role: AppRole,
    deliveryType: DeliveryType
  ): TransitionConfig {
    const config = STATE_MACHINE.find(t => 
      t.action === action && 
      (Array.isArray(t.current) ? t.current.includes(currentState) : t.current === currentState)
    )

    if (!config) {
      throw new Error(`Invalid state transition: Action '${action}' is not allowed from state '${currentState}'`)
    }

    if (!config.roles.includes(role)) {
      throw new Error(`Permission denied: Role '${role}' is not allowed to perform action '${action}'`)
    }

    if (config.allowedDeliveryTypes && !config.allowedDeliveryTypes.includes(deliveryType)) {
      throw new Error(`Invalid action: Action '${action}' is not allowed for delivery type '${deliveryType}'`)
    }

    return config
  }
}
