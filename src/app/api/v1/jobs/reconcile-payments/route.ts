import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/PaymentService';
import { RazorpayProvider } from '@/services/payment/providers/RazorpayProvider';
import { PaymentRepository } from '@/services/payment/PaymentRepository';

export async function GET(request: Request) {
  try {
    // 1. Verify Authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev_cron_secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Initialize Service
    const provider = new RazorpayProvider();
    const repo = new PaymentRepository();
    const paymentService = new PaymentService(provider, repo);

    // 3. Run Reconciliation
    const startTime = new Date().toISOString();
    const result = await paymentService.reconcilePendingPayments();
    const endTime = new Date().toISOString();

    // 4. Log Execution
    console.log('[CRON] Reconciliation Job Completed:', {
      startTime,
      endTime,
      ...result
    });

    // 5. Return Summary
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[CRON] Reconciliation Job Failed:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
