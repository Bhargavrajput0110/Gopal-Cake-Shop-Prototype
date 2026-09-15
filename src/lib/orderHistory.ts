/**
 * Persists recent order tracking IDs in localStorage so customers
 * can find their orders even after closing the browser.
 */

const KEY = 'gcs_my_orders';

export interface SavedOrder {
  trackingId: string;
  orderNumber: string;
  phone: string;
  placedAt: string; // ISO date
  totalAmount: number;
  previewItems: string; // e.g. "Chocolate Cake × 1, Black Forest × 2"
}

export function saveOrderToHistory(order: SavedOrder) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalOrders();
    // Deduplicate by trackingId
    const updated = [order, ...existing.filter(o => o.trackingId !== order.trackingId)].slice(0, 10);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch (e) {
    // localStorage unavailable (private mode etc.)
  }
}

export function getLocalOrders(): SavedOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
