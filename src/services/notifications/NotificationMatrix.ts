/**
 * NotificationMatrix — V4 Architecture
 *
 * Maps Timeline action strings (from OrderStateMachine) to notification rules.
 * WhatsApp rules now use NotificationType strings that WhatsAppTemplateService resolves.
 * Delivery-type discrimination happens inside WhatsAppTemplateService, not here.
 */

export interface NotificationRule {
  /** Who receives the notification */
  recipientRole: 'CUSTOMER' | 'CHEF' | 'DELIVERY' | 'SALES' | 'MANAGER' | 'DRIVER_ASSIGNEE' | 'BRANCH_STAFF';
  channel: 'WHATSAPP' | 'SMS' | 'PUSH' | 'IN_APP';
  /**
   * For WHATSAPP channel: a NotificationType key consumed by WhatsAppTemplateService.
   * For IN_APP/PUSH channels: a human-readable label for the notification title.
   */
  templateName: string;
}

/**
 * Maps Timeline `action` strings (from OrderStateMachine.TransitionAction)
 * to arrays of NotificationRule.
 *
 * IMPORTANT: Do NOT add delivery-type logic here.
 * WhatsApp template selection by delivery type is handled in WhatsAppTemplateService.
 */
export const NotificationMatrix: Record<string, NotificationRule[]> = {
  // Quote created -> customer receives quote notification
  'send-quote': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'QUOTE_CREATED' },
  ],

  // Sales approves the order → customer receives approval message
  'approve': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'ORDER_APPROVED' },
    { recipientRole: 'CHEF', channel: 'IN_APP', templateName: 'Order Approved — Awaiting Chef' },
  ],

  // Chef accepts the order
  'chef-accept': [
    { recipientRole: 'BRANCH_STAFF', channel: 'IN_APP', templateName: 'Chef Accepted Order' },
  ],

  // Chef starts making
  'start-making': [
    { recipientRole: 'BRANCH_STAFF', channel: 'IN_APP', templateName: 'Order In Production' },
  ],

  // Chef marks order as ready (READY_FOR_PICKUP)
  // WhatsApp message goes to CUSTOMER; delivery type discriminated in WhatsAppTemplateService
  'ready': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'ORDER_READY' },
    { recipientRole: 'DELIVERY', channel: 'IN_APP', templateName: 'Order Ready — Assign Driver' },
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Order Ready for Dispatch' },
  ],

  // Driver assigned
  'assign-driver': [
    { recipientRole: 'DRIVER_ASSIGNEE', channel: 'IN_APP', templateName: 'Delivery Assigned to You' },
  ],

  // Driver marks order as on the way (DELIVERY only)
  'on-the-way': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'OUT_FOR_DELIVERY' },
  ],

  // Driver marks delivered (DELIVERY only)
  'deliver': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'ORDER_DELIVERED' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Order Delivered' },
  ],

  // Salesperson marks pickup complete (PICKUP only)
  'complete': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'ORDER_PICKED_UP' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Order Picked Up' },
  ],

  // Admin/Sales cancels the order
  'cancel': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'ORDER_CANCELLED' },
    { recipientRole: 'CHEF', channel: 'IN_APP', templateName: 'Order Cancelled' },
    { recipientRole: 'BRANCH_STAFF', channel: 'IN_APP', templateName: 'Order Cancelled' },
  ],

  // Failure recovery
  'fail-delivery': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Delivery Failed' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Delivery Failed' },
  ],
  'MARK_FAILED': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Delivery Failed' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Delivery Failed' },
  ],

  // Vendor tasks (in-app only)
  'VENDOR_ACCEPTED': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Vendor Accepted' },
  ],
  'VENDOR_READY': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Vendor Component Ready' },
  ],

  // Admin override (driver assignment via admin)
  'ADMIN_OVERRIDE': [
    { recipientRole: 'DRIVER_ASSIGNEE', channel: 'IN_APP', templateName: 'Delivery Assigned to You' },
  ],
};
