import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(req: Request) {
  try {
    const { reviewId, approved } = await req.json();

    if (!reviewId || approved === undefined) {
      return NextResponse.json({ error: 'reviewId and approved status are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('Review')
      .update({ approved: Boolean(approved) })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Reviews moderate PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
