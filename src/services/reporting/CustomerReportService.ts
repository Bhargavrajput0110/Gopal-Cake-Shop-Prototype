import { prisma } from '@/lib/prisma';
import { CustomerMetricsDTO, ReportingFilters } from './types';

export class CustomerReportService {
  static async getMetrics(filters: ReportingFilters): Promise<CustomerMetricsDTO> {
    const { startDate, endDate, branchId } = filters;

    // Fetch orders in this period
    const where: any = {
      createdAt: { gte: startDate, lte: endDate }
    };
    if (branchId) where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      select: { customerId: true, totalAmount: true }
    });

    const uniqueCustomerIds = [...new Set(orders.map(o => o.customerId))];

    // Check which customers were created in this period
    const newCustomersCount = await prisma.customer.count({
      where: {
        id: { in: uniqueCustomerIds },
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const repeatCustomersCount = uniqueCustomerIds.length - newCustomersCount;

    // Averages and Top Customers
    const customerSpendMap: Record<string, { totalSpend: number, ordersCount: number }> = {};
    orders.forEach(o => {
      if (!customerSpendMap[o.customerId]) {
        customerSpendMap[o.customerId] = { totalSpend: 0, ordersCount: 0 };
      }
      customerSpendMap[o.customerId].totalSpend += Number(o.totalAmount);
      customerSpendMap[o.customerId].ordersCount += 1;
    });

    const averageSpendPerCustomer = uniqueCustomerIds.length > 0 
      ? orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / uniqueCustomerIds.length 
      : 0;

    const ordersPerCustomer = uniqueCustomerIds.length > 0
      ? orders.length / uniqueCustomerIds.length
      : 0;

    // Top 5 customers by spend
    const sortedCustomers = Object.entries(customerSpendMap)
      .sort((a, b) => b[1].totalSpend - a[1].totalSpend)
      .slice(0, 5);

    // Fetch names for top customers
    let topCustomers: { customerId: string; name: string; totalSpend: number; ordersCount: number }[] = [];
    if (sortedCustomers.length > 0) {
      const topCustomerIds = sortedCustomers.map(sc => sc[0]);
      const customers = await prisma.customer.findMany({
        where: { id: { in: topCustomerIds } },
        select: { id: true, name: true }
      });
      const nameMap = customers.reduce((acc, c) => { acc[c.id] = c.name; return acc; }, {} as Record<string, string>);

      topCustomers = sortedCustomers.map(([customerId, stats]) => ({
        customerId,
        name: nameMap[customerId] || customerId,
        totalSpend: stats.totalSpend,
        ordersCount: stats.ordersCount
      }));
    }

    return {
      newCustomers: newCustomersCount,
      repeatCustomers: repeatCustomersCount,
      averageSpendPerCustomer,
      ordersPerCustomer,
      topCustomers
    };
  }
}
