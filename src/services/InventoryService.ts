import { prisma } from '@/lib/prisma';
import { LoggerService } from './LoggerService';

export class InventoryService {
  /**
   * Pure Business Logic: Determines if a product is available for sale.
   * Extracted from persistence layer for @unit testing and Stryker mutation testing.
   */
  static isAvailableForSale(
    product: {
      status: string; // 'active', 'archived', 'draft'
      availableForSale: boolean; // Manual override flag
      productionLimit: number | null; // Max allowed per day/period
    },
    soldQuantity: number
  ): boolean {
    if (product.status === 'archived' || product.status === 'draft') {
      return false;
    }

    if (!product.availableForSale) {
      return false;
    }

    if (product.productionLimit !== null) {
      if (product.productionLimit < 0) {
        return false; // Negative values rejected
      }
      if (soldQuantity >= product.productionLimit) {
        return false;
      }
    }

    return true;
  }

  /**
   * Toggles the availableForSale flag for a specific product.
   */
  static async setAvailability(productId: string, isAvailable: boolean, actorId: string) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { availableForSale: isAvailable }
    });

    // We can emit an event or just log the manual adjustment.
    LoggerService.info(`Product availability updated`, { productId, isAvailable, actorId });
    return product;
  }

  /**
   * Bulk updates availability (e.g. at the end of the day or due to sudden ingredient shortage)
   */
  static async bulkSetAvailability(productIds: string[], isAvailable: boolean, actorId: string) {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { availableForSale: isAvailable }
    });

    LoggerService.info(`Bulk availability update`, { count: result.count, isAvailable, actorId });
    return result;
  }
}
