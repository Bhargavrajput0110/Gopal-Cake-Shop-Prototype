import { FinancialReportService } from './FinancialReportService';
import { SalesReportService } from './SalesReportService';
import { ProductionReportService } from './ProductionReportService';
import { DeliveryReportService } from './DeliveryReportService';
import { CustomerReportService } from './CustomerReportService';
import { ReportingFilters } from './types';

export class ReportingService {
  static getFinancialMetrics(filters: ReportingFilters) {
    return FinancialReportService.getMetrics(filters);
  }

  static getSalesMetrics(filters: ReportingFilters) {
    return SalesReportService.getMetrics(filters);
  }

  static getProductionMetrics(filters: ReportingFilters) {
    return ProductionReportService.getMetrics(filters);
  }

  static getDeliveryMetrics(filters: ReportingFilters) {
    return DeliveryReportService.getMetrics(filters);
  }

  static getCustomerMetrics(filters: ReportingFilters) {
    return CustomerReportService.getMetrics(filters);
  }
}
