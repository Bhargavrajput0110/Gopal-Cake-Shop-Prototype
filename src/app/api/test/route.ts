import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const u = await prisma.user.findUnique({ where: { id: 'SYSTEM' } })
  return NextResponse.json({ systemUser: u })
}
