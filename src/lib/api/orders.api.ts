import { fetchClient } from './client'
import { PosCheckoutDTO, OrderResponseDTO } from '@/dtos/OrderSchemas'

export const OrdersApiClient = {
  // POS: hits /api/v1/pos/checkout
  checkoutPos: (data: PosCheckoutDTO) => fetchClient<OrderResponseDTO>('/pos/checkout', {
    method: 'POST',
    body: JSON.stringify(data),
  }),


  // Driver pool: hits /api/v1/orders (driver filters applied server-side)
  getDriverOrders: async () => {
    const res = await fetchClient<{ success: boolean, data: import('@/dtos/OrderSchemas').DriverOrderDTO[] }>('/orders?role=driver')
    return res.data || []
  },

  // Transitions: hits /api/v1/orders/[id]/actions/[action]
  transitionOrder: (id: string, action: string, note?: string) =>
    fetchClient<{ success: boolean }>(`/orders/${id}/actions/${action}`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Single Order Details: hits /api/v1/orders/[id]
  getOrder: (id: string) =>
    fetchClient<{ success: boolean, data: any }>(`/orders/${id}`),

  // Admin Dashboard: hits /api/v1/orders
  getAdminOrders: () =>
    fetchClient<{ success: boolean, data: any[], pagination: any }>('/orders?limit=100'),

  // Timeline: hits /api/v1/orders/[id]/timeline
  getOrderTimeline: (id: string) => 
    fetchClient<{ success: boolean, data: any[] }>(`/orders/${id}/timeline`),

  // QC Checklist: hits /api/v1/orders/[id]/qc
  saveQC: (id: string, items: Record<string, boolean>) =>
    fetchClient<{ success: boolean }>(`/orders/${id}/qc`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
}
