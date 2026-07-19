export interface NotificationRule {
  recipientRole: string; // e.g. 'CUSTOMER', 'CHEF', 'VENDOR', 'DELIVERY', 'SALES', 'MANAGER', 'DRIVER_ASSIGNEE', 'BRANCH_STAFF'
  channel: 'WHATSAPP' | 'SMS' | 'PUSH' | 'IN_APP';
  templateName: string;
}

// Maps Timeline `action` strings to a list of Notification Rules
export const NotificationMatrix: Record<string, NotificationRule[]> = {
  'checkout': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'Order Received' },
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Order Placed' }
  ],
  'chef-accept': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'Chef Accepted' }
  ],
  'VENDOR_ACCEPTED': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Vendor Accepted' }
  ],
  'VENDOR_READY': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Vendor Component Ready' }
  ],
  'ready': [
    // This is typically a broadcast to delivery drivers in the branch if order is delivery
    { recipientRole: 'DELIVERY', channel: 'IN_APP', templateName: 'Ready For Pickup Broadcast' }
  ],
  'assign-driver': [
    { recipientRole: 'DRIVER_ASSIGNEE', channel: 'PUSH', templateName: 'Assigned to Driver' }
  ],
  'ADMIN_OVERRIDE': [
    // Admin assigned driver is an ADMIN_OVERRIDE action with nextState ASSIGNED_TO_DRIVER
    // We will handle dynamic checks in the service, but let's define rule:
    { recipientRole: 'DRIVER_ASSIGNEE', channel: 'PUSH', templateName: 'Assigned to Driver' }
  ],
  'on-the-way': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'On The Way' }
  ],
  'deliver': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'DELIVERED' }
  ],
  'fail-delivery': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Delivery Failed' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Delivery Failed' }
  ],
  'cancel': [
    { recipientRole: 'CUSTOMER', channel: 'WHATSAPP', templateName: 'CANCELLED' },
    { recipientRole: 'CHEF', channel: 'IN_APP', templateName: 'CANCELLED' },
    { recipientRole: 'BRANCH_STAFF', channel: 'IN_APP', templateName: 'CANCELLED' }
  ],
  'MARK_FAILED': [
    { recipientRole: 'SALES', channel: 'IN_APP', templateName: 'Delivery Failed' },
    { recipientRole: 'MANAGER', channel: 'IN_APP', templateName: 'Delivery Failed' }
  ]
};
