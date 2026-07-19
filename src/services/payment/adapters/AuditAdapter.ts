import { prisma } from '@/lib/prisma';

export class AuditAdapter {
  static async log(action: string, recordId: string, newValue: any, reason?: string) {
    return prisma.auditLog.create({
      data: {
        action,
        tableName: 'Payment',
        recordId,
        newValue,
        reason
      }
    });
  }
}
