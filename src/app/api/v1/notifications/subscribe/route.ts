import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string()
    })
  }),
  userAgent: z.string().optional()
});

export const POST = withApiHandler(async ({ req, user }) => {
  const body = await req.json();
  const parsed = SubscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  const { subscription, userAgent } = parsed.data;

  // We use upsert so that if the endpoint exists, we just update it
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: user.id, // Reassign if somehow it changed (unlikely for same endpoint)
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
      lastUsedAt: new Date()
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: user.id,
      userAgent: userAgent || null
    }
  });

  return NextResponse.json({ success: true }, { status: 201 });
});
