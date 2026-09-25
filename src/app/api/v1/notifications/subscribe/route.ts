import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';

export const POST = withApiHandler(async ({ req, user }) => {
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await req.json();

  if (!subscription || !subscription.endpoint) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  // Look for existing subscription by endpoint
  const existing = await prisma.pushSubscription.findFirst({
    where: { endpoint: subscription.endpoint }
  });

  if (existing) {
    // Update if needed, though endpoint usually means it's the same
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        userId: user.id,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
        updatedAt: new Date()
      }
    });
  } else {
    // Create new
    await prisma.pushSubscription.create({
      data: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      }
    });
  }

  return NextResponse.json({ success: true });
});
