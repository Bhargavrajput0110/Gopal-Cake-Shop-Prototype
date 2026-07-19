import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { toBranchId } from '@/lib/branches';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branch = searchParams.get('branch');
  const channel = searchParams.get('channel');

  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(50);

    if (branch) {
      // Support both canonical IDs and display names
      query = query.eq('targetBranch', toBranchId(branch));
    }
    if (channel && channel !== 'all') {
      query = query.or(`targetRole.eq.${channel},targetRole.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      // Table might not exist yet — return empty gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, messages: [] });
      }
      throw error;
    }

    return NextResponse.json({ success: true, messages: (data || []).reverse() });
  } catch (error: any) {
    console.error('Messages GET error:', error);
    // Return empty list rather than crashing the page
    return NextResponse.json({ success: true, messages: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, senderName, senderRole, branch, text, channel } = body;

    if (!senderId || !senderName || !text) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Always store using canonical branch ID
    const canonicalBranch = branch ? toBranchId(branch) : 'khanderao';

    const payload = {
      senderId,
      senderName,
      senderRole,
      content: text,  // DB column is `content`
      targetBranch: canonicalBranch,
      targetRole: (channel && channel !== 'all') ? channel : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Table might not exist yet — handle gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, message: { ...payload, id: 'temp-' + Date.now() } }, { status: 201 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, message: data }, { status: 201 });
  } catch (error: any) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
