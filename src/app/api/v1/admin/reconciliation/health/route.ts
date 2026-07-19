import { NextResponse } from 'next/server';
import { ReconciliationService } from '@/services/payment/ReconciliationService';
import { Role } from '@prisma/client';

export async function GET(req: Request) {
  try {
    // Basic auth check (if implemented in your app, adapt as necessary)
    // const session = await getServerSession();
    // if (!session || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const report = await ReconciliationService.getHealthReport();

    // If manager, we might filter report to only show their branch issues (can be implemented later)

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('Reconciliation Health API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
