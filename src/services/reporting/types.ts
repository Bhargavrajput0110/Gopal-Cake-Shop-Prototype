export interface ReportingFilters {
  startDate: Date;
  endDate: Date;
  branchId: string | null;
}

export interface FinancialMetricsDTO {
  revenue: number;
  dailyRevenue: { date: string; revenue: number }[];
  weeklyRevenue: { week: string; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  branchRevenue: { branchName: string; branchId: string; revenue: number }[];
  
  ledger: {
    payments: number;
    refunds: number;
    waivers: number;
    outstanding: number; // For orders that are not fully paid
    netRevenue: number;
  };

  paymentMethods: {
    CASH: number;
    UPI: number;
    CARD: number;
    ONLINE_GATEWAY: number;
  };

  collectionRate: number; // collected / total billed
}

export interface SalesMetricsDTO {
  ordersByStatus: { status: string; count: number }[];
  ordersByBranch: { branchName: string; branchId: string; count: number }[];
  averageOrderValue: number;
  peakOrderingHours: { hour: string; count: number }[];
  cancellationRate: number; // Cancelled / Total
  conversionRate: {
    quote: number;
    confirmed: number;
    delivered: number;
    percentage: number;
  };
}

export interface ProductionMetricsDTO {
  chefWorkload: { chefName: string; assignedItems: number }[];
  vendorWorkload: { vendorName: string; assignedItems: number }[];
  averagePreparationTime: number; // in minutes, calculated via Timeline
  pendingItems: number;
  bottlenecks: { stage: string; count: number }[];
}

export interface DeliveryMetricsDTO {
  driverWorkload: { driverName: string; deliveries: number }[];
  averageDeliveryTime: number; // in minutes, calculated via Timeline
  onTimeDeliveries: number;
  lateDeliveries: number;
  failedDeliveries: number;
  crossBranchDeliveries: number;
}

export interface CustomerMetricsDTO {
  newCustomers: number;
  repeatCustomers: number;
  averageSpendPerCustomer: number;
  ordersPerCustomer: number;
  topCustomers: { customerId: string; name: string; totalSpend: number; ordersCount: number }[];
}
