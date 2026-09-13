export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const o = await prisma.order.findUnique({
      where: { id: 'cmtmj659f002a4gu3m0oaoks6' },
      select: { deliveryType: true }
    });
    return NextResponse.json({ order: o });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
