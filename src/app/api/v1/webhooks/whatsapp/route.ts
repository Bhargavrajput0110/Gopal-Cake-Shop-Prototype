import { NextResponse } from 'next/server';
import { LoggerService } from '@/services/LoggerService';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/webhooks/whatsapp
 * Used for Meta Webhook Challenge Verification.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    LoggerService.info('[WhatsApp Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  } else {
    LoggerService.warn(`[WhatsApp Webhook] Verification failed. Token: ${token}`);
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
  }
}

/**
 * POST /api/v1/webhooks/whatsapp
 * Handles incoming messages and delivery receipts.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object) {
      if (
        body.entry &&
        body.entry[0].changes &&
        body.entry[0].changes[0] &&
        body.entry[0].changes[0].value.statuses
      ) {
        // Handle delivery status update
        const statuses = body.entry[0].changes[0].value.statuses;
        for (const status of statuses) {
          const messageId = status.id;
          const statusVal = status.status; // 'sent', 'delivered', 'read', 'failed'
          
          LoggerService.info(`[WhatsApp Webhook] Message ${messageId} status: ${statusVal}`);
          
          // Optionally, find the NotificationLog by messageId if we were storing it, 
          // and update its status. Since we didn't store messageId previously, we skip for now.
        }
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 404 });
    }
  } catch (err: any) {
    LoggerService.error('[WhatsApp Webhook] POST error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
