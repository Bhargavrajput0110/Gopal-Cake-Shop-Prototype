import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { orderId, customerId, subscription } = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('PushSubscription')
      .upsert(
        {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          customerId: customerId || null,
          orderId: orderId || null,
          updatedAt: new Date().toISOString()
        },
        { onConflict: 'endpoint' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Notifications subscribe POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
