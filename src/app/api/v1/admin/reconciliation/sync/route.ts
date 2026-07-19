import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/PaymentService';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Basic auth check (if implemented in your app, adapt as necessary)
    // const session = await getServerSession();
    // if (!session || session.user.role !== Role.ADMIN) {
    //   return NextResponse.json({ error: 'Unauthorized. Only Admins can sync.' }, { status: 401 });
    // }

    // Start timer for manual sync
    const start = performance.now();

    // The actual reconciliation job 
    const result = await PaymentService.reconcilePendingPayments();

    const durationMs = Math.round(performance.now() - start);

    // Audit Log for manual trigger
    await prisma.auditLog.create({
      data: {
        action: 'MANUAL_RECONCILIATION',
        tableName: 'Payment',
        recordId: 'global',
        newValue: { ...result, durationMs },
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Reconciliation Complete',
      data: {
        ...result,
        durationMs
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Reconciliation Sync API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
