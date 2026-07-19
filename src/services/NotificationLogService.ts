import { getIsolatedPrisma } from '@/lib/prisma'
import { NotificationLogResponseDTO } from '@/dtos/NotificationSchemas'

export class NotificationLogService {
  static async listLogs(
    branchId: string | null,
    role: string | null,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: NotificationLogResponseDTO[], total: number }> {
    const db = getIsolatedPrisma(branchId, role)
    const skip = (page - 1) * limit
    
    // Notifications might not be branch-isolated directly, but they are linked to orders which are.
    // getIsolatedPrisma handles order branch isolation, but we must ensure we only fetch logs for those orders if we are restricted to a branch.
    // For now, if role is ADMIN, fetch all. If not, fetch logs where order.branchId === branchId.
    
    let whereClause = {}
    if (role !== 'ADMIN' && branchId) {
      whereClause = {
        order: {
          branchId
        }
      }
    }

    const [logs, total] = await Promise.all([
      db.notificationLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notificationLog.count({ where: whereClause }),
    ])

    return {
      data: logs.map(l => ({
        id: l.id,
        orderId: l.orderId,
        recipient: l.recipient,
        channel: l.channel,
        templateName: l.templateName,
        status: l.status,
        errorMessage: l.errorMessage,
        sentAt: l.sentAt,
        createdAt: l.createdAt,
      })),
      total,
    }
  }
}
