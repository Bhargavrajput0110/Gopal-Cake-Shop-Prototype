/**
 * src/lib/vendorSla.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central SLA calculation and monitoring utility for external vendor tasks
 * (Florist, Photo Prints, Acrylic Toppers).
 *
 * Business Rule:
 * If an external vendor has not accepted an assigned task within 60 minutes
 * of order placement, or if the task is rejected, it escalates as an SLA Breach
 * so Sales and Kitchen staff are alerted before the cake reaches decoration.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface VendorSlaStatus {
  isBreached: boolean;
  reason?: 'UNACCEPTED_TIMEOUT' | 'REJECTED' | 'UNASSIGNED';
  taskType?: string;
  vendorName?: string;
  vendorPhone?: string;
  minutesElapsed: number;
  taskStatus?: string;
}

export function checkOrderVendorSla(order: any): VendorSlaStatus {
  if (!order) return { isBreached: false, minutesElapsed: 0 };
  
  // Terminal or completed states cannot breach SLA
  const terminalStatuses = ['COMPLETED', 'DELIVERED', 'CANCELLED', 'READY_FOR_PICKUP'];
  if (terminalStatuses.includes(order.status)) {
    return { isBreached: false, minutesElapsed: 0 };
  }

  const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : Date.now();
  const minutesElapsed = Math.max(0, Math.floor((Date.now() - orderCreatedAt) / (60 * 1000)));

  // 1. Check formal VendorTask entries
  if (Array.isArray(order.vendorTasks) && order.vendorTasks.length > 0) {
    for (const vt of order.vendorTasks) {
      const status = (vt.status || '').toLowerCase();
      if (status === 'rejected') {
        return {
          isBreached: true,
          reason: 'REJECTED',
          taskType: formatVendorType(vt.vendorType),
          vendorName: vt.vendorName,
          vendorPhone: vt.vendorPhone,
          minutesElapsed,
          taskStatus: 'rejected'
        };
      }
      if ((status === 'pending' || status === 'assigned') && minutesElapsed >= 60) {
        return {
          isBreached: true,
          reason: 'UNACCEPTED_TIMEOUT',
          taskType: formatVendorType(vt.vendorType),
          vendorName: vt.vendorName,
          vendorPhone: vt.vendorPhone,
          minutesElapsed,
          taskStatus: status
        };
      }
    }
  }

  // 2. Check child OrderItems assigned to vendors (e.g. PHOTO Component, FLORIST Component)
  if (Array.isArray(order.items) && order.items.length > 0) {
    const vendorComponents = order.items.filter((i: any) => 
      i.parentItemId || 
      i.name?.toLowerCase().includes('component') ||
      i.productName?.toLowerCase().includes('component') ||
      i.assignedVendorId
    );

    for (const comp of vendorComponents) {
      const status = (comp.status || '').toUpperCase();
      if (status === 'REJECTED') {
        return {
          isBreached: true,
          reason: 'REJECTED',
          taskType: comp.name || comp.productName || 'Vendor Component',
          vendorName: comp.assignedVendorName,
          minutesElapsed,
          taskStatus: 'rejected'
        };
      }
      if ((status === 'PENDING' || status === 'WAITING_FOR_CHEF' || status === 'UNASSIGNED') && minutesElapsed >= 60) {
        return {
          isBreached: true,
          reason: 'UNACCEPTED_TIMEOUT',
          taskType: comp.name || comp.productName || 'Vendor Component',
          vendorName: comp.assignedVendorName,
          minutesElapsed,
          taskStatus: status.toLowerCase()
        };
      }
    }
  }

  return { isBreached: false, minutesElapsed };
}

function formatVendorType(rawType?: string): string {
  if (!rawType) return 'Vendor Task';
  const lower = rawType.toLowerCase();
  if (lower.includes('photo')) return 'Edible Photo Print';
  if (lower.includes('flower') || lower.includes('florist')) return 'Fresh Flowers / Bouquet';
  if (lower.includes('acrylic') || lower.includes('topper')) return 'Acrylic Cake Topper';
  return rawType.replace(/_/g, ' ');
}
