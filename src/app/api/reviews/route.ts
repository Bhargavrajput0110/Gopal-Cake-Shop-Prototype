import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { orderId, productId, customerId, rating, comment } = await req.json();

    if (!productId || !customerId || rating === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Review')
      .insert({
        orderId,
        productId,
        customerId,
        rating: ratingNum,
        comment,
        approved: false
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const moderation = searchParams.get('moderation') === 'true';

    let query = supabaseAdmin
      .from('Review')
      .select('*, users(name), products(name)');

    if (!moderation) {
      query = query.eq('approved', true);
    }

    if (productId) {
      query = query.eq('productId', productId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const reviews = (data || []).map((r: any) => ({
      ...r,
      reviewerName: r.users?.name || 'Anonymous',
      productName: r.products?.name || 'Unknown Product'
    }));

    return NextResponse.json(reviews, { status: 200 });
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
