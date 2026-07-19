import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardKPIService } from '../../src/services/reporting/DashboardKPIService';
import { prisma } from '../../src/lib/prisma';

vi.mock('../../src/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    ledgerEntry: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
    }
  }
}));

describe('DashboardKPIService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calculates KPIs correctly for today', async () => {
    // Mock today's ledger entries (sales & refunds)
    vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([
      { type: 'PAYMENT', amount: 100, branchId: 'Branch-A', branch: { name: 'A' } },
      { type: 'PAYMENT', amount: 200, branchId: 'Branch-A', branch: { name: 'A' } },
      { type: 'REFUND', amount: -50, branchId: 'Branch-A', branch: { name: 'A' } },
    ] as any);
    
    // Mock today's orders for counts
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      { id: '1', status: 'DELIVERED', items: [{ productName: 'Cake A', quantity: 1, price: 100 }], timeline: [] },
      { id: '2', status: 'NEW', items: [{ productName: 'Cake A', quantity: 2, price: 100 }], timeline: [] },
      { id: '3', status: 'CANCELLED', items: [], timeline: [] }, 
    ] as any);

    // Mock late orders count
    vi.mocked(prisma.order.count).mockResolvedValue(0);

    vi.mocked(prisma.timeline.findMany).mockResolvedValue([]);

    const kpis = await DashboardKPIService.getKPIs({ branchId: null, date: new Date() } as any);

    expect(kpis.todaysSales).toBe(300); // 100 + 200
    expect(kpis.todaysRefunds).toBe(-50);
    expect(kpis.ordersToday).toBe(2); // Only DELIVERED and NEW, CANCELLED doesn't count towards revenue order count
    expect(kpis.pendingOrders).toBe(1); // The 'NEW' one
    expect(kpis.averageOrderValue).toBe(150); // 300 / 2
    expect(kpis.ordersByStatus).toEqual({
      DELIVERED: 1,
      NEW: 1,
      CANCELLED: 1
    });
  });

  it('filters by branchId', async () => {
    vi.mocked(prisma.ledgerEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.order.count).mockResolvedValue(0);
    vi.mocked(prisma.timeline.findMany).mockResolvedValue([]);

    await DashboardKPIService.getKPIs({ branchId: 'Branch-A' });

    expect(prisma.ledgerEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        branchId: 'Branch-A'
      })
    }));
  });
});
