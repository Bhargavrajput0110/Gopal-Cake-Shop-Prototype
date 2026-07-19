import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { LoggerService } from '@/services/LoggerService';

export const GET = withApiHandler(async () => {
  try {
    // 1. Check Outbox Queue
    const pendingOutboxCount = await prisma.outbox.count({ where: { status: 'PENDING' } });
    const failedOutboxCount = await prisma.outbox.count({ where: { status: 'FAILED' } });
    
    // 2. Check Push Subscriptions
    const activePushSubs = await prisma.pushSubscription.count();

    // 3. Test WhatsApp Connectivity (Basic Token Check)
    let whatsappHealthy = false;
    if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID) {
      whatsappHealthy = true;
      // In a deeper health check, we could ping the WhatsApp Meta API
    }

    return NextResponse.json({
      success: true,
      whatsapp: {
        healthy: whatsappHealthy,
        configured: !!process.env.WHATSAPP_ACCESS_TOKEN
      },
      outbox: {
        pending: pendingOutboxCount,
        failed: failedOutboxCount,
        healthy: failedOutboxCount === 0 && pendingOutboxCount < 50
      },
      push: {
        healthy: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        activeSubscriptions: activePushSubs
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    LoggerService.error('[Health/Notifications] Failed to fetch health metrics', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch metrics' }, { status: 500 });
  }
}, false, 'manage_settings');
