import { prisma } from '@/lib/prisma'
import { mediaService, extractCloudinaryPublicId } from '@/lib/media/CloudinaryMediaProvider'

export interface CleanupResult {
  success: boolean
  processedOrders: number
  deletedMediaCount: number
  failedMediaCount: number
  ordersCleaned: string[]
  errors: string[]
  timestamp: string
}

/**
 * List of folder paths that MUST NEVER be automatically deleted.
 * These are permanent catalog, website, or marketing assets.
 */
const PROTECTED_FOLDERS = [
  'catalog/',
  'products/',
  'designs/',
  'bouquets/',
  'fresh-cakes/',
  'hot-bakes/',
  'website/',
  'banners/'
]

/**
 * Service to automatically purge temporary customer-uploaded media from Cloudinary
 * after 48 hours once an order is marked DELIVERED or CANCELLED.
 *
 * Targets:
 * 1. Customer reference cake photos (OrderItemMedia with type = REFERENCE)
 * 2. Customer photo-print cake photos (OrderItemMedia with type = PRODUCTION / edible_prints)
 * 3. Customer design images on custom order items (OrderItem.designImageUrl)
 */
export class CustomerMediaRetentionService {
  /** Default retention window in hours after delivery/cancellation */
  static readonly RETENTION_HOURS = 48

  /**
   * Checks whether a publicId is safe to delete (not a catalog/brand asset).
   */
  private static isSafeToDelete(publicId: string): boolean {
    const lower = publicId.toLowerCase()
    for (const folder of PROTECTED_FOLDERS) {
      if (lower.includes(folder)) {
        return false
      }
    }
    return true
  }

  /**
   * Main cleanup runner.
   * Can be invoked by scheduled cron or manual admin trigger.
   */
  static async cleanupExpiredMedia(options?: {
    retentionHours?: number
    batchSize?: number
  }): Promise<CleanupResult> {
    const hours = options?.retentionHours ?? this.RETENTION_HOURS
    const batchSize = options?.batchSize ?? 100
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000)

    const result: CleanupResult = {
      success: true,
      processedOrders: 0,
      deletedMediaCount: 0,
      failedMediaCount: 0,
      ordersCleaned: [],
      errors: [],
      timestamp: new Date().toISOString()
    }

    try {
      // Find orders that are DELIVERED or CANCELLED
      // and whose updatedAt is before the cutoff time
      const candidateOrders = await prisma.order.findMany({
        where: {
          status: { in: ['DELIVERED', 'CANCELLED'] },
          updatedAt: { lte: cutoffTime },
          OR: [
            {
              items: {
                some: {
                  media: {
                    some: {
                      type: { in: ['REFERENCE', 'PRODUCTION'] }
                    }
                  }
                }
              }
            },
            {
              items: {
                some: {
                  designImageUrl: {
                    contains: 'cloudinary.com'
                  }
                }
              }
            }
          ]
        },
        include: {
          timeline: {
            where: {
              status: { in: ['DELIVERED', 'CANCELLED'] }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          items: {
            include: {
              media: {
                where: {
                  type: { in: ['REFERENCE', 'PRODUCTION'] }
                }
              }
            }
          },
          vendorTasks: true
        },
        take: batchSize
      })

      for (const order of candidateOrders) {
        // Double-check exact transition time from Timeline
        // If the order reached DELIVERED/CANCELLED less than 48 hours ago, skip for now
        const transitionTime = order.timeline[0]?.createdAt || order.updatedAt
        if (transitionTime > cutoffTime) {
          continue
        }

        let orderHadDeletions = false

        for (const item of order.items) {
          // 1. Delete OrderItemMedia (REFERENCE & PRODUCTION customer uploads)
          for (const media of item.media) {
            const publicId = extractCloudinaryPublicId(media.url)
            if (!publicId || !this.isSafeToDelete(publicId)) {
              continue
            }

            try {
              // Delete from Cloudinary CDN
              const deleted = await mediaService.delete(publicId)
              if (deleted) {
                // Delete from DB so it is never re-processed
                await prisma.orderItemMedia.delete({
                  where: { id: media.id }
                })
                result.deletedMediaCount++
                orderHadDeletions = true
              } else {
                result.failedMediaCount++
                result.errors.push(`Failed to delete Cloudinary asset: ${publicId}`)
              }
            } catch (err: any) {
              result.failedMediaCount++
              result.errors.push(`Error deleting ${publicId}: ${err?.message || err}`)
            }
          }

          // 2. Clear customer photo from item.designImageUrl if uploaded for this item
          if (item.designImageUrl && item.designImageUrl.includes('cloudinary.com')) {
            const publicId = extractCloudinaryPublicId(item.designImageUrl)
            // Only delete if it belongs to customer uploads (not catalog designs)
            if (publicId && this.isSafeToDelete(publicId)) {
              const isCustomerUpload = 
                publicId.includes('edible_prints') ||
                publicId.includes('custom_references') ||
                publicId.includes('references') ||
                publicId.includes('photo-cake') ||
                publicId.includes('customer-reference')

              if (isCustomerUpload) {
                try {
                  await mediaService.delete(publicId)
                  await prisma.orderItem.update({
                    where: { id: item.id },
                    data: { designImageUrl: null }
                  })
                  result.deletedMediaCount++
                  orderHadDeletions = true
                } catch (err: any) {
                  result.errors.push(`Error deleting design image ${publicId}: ${err?.message || err}`)
                }
              }
            }
          }
        }

        // 3. Clean up VendorTask cached notes if they reference customer photos
        if (order.vendorTasks && order.vendorTasks.length > 0) {
          for (const vt of order.vendorTasks) {
            if (vt.notes && typeof vt.notes === 'object') {
              const notesObj = vt.notes as Record<string, any>
              if (notesObj.photoUrl && notesObj.photoUrl !== '[PURGED_AFTER_48H]') {
                await prisma.vendorTask.update({
                  where: { id: vt.id },
                  data: {
                    notes: {
                      ...notesObj,
                      photoUrl: '[PURGED_AFTER_48H]'
                    }
                  }
                })
              }
            }
          }
        }

        if (orderHadDeletions) {
          result.processedOrders++
          result.ordersCleaned.push(order.orderNumber)
        }
      }

      return result
    } catch (error: any) {
      console.error('[CustomerMediaRetentionService] Cleanup failed:', error)
      return {
        ...result,
        success: false,
        errors: [...result.errors, error?.message || 'Unknown database error']
      }
    }
  }
}

