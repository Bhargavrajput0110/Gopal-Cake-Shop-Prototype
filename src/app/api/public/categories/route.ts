import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (e: any) {
    console.error('Failed to fetch public categories:', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
