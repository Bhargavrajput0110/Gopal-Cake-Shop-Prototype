import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'

const handler = async (ctx: HandlerContext) => {
  const { searchParams } = ctx.req.nextUrl
  const categoryId = searchParams.get('category')
  let search = searchParams.get('search')
  let sort = searchParams.get('sort') || 'newest'
  let page = parseInt(searchParams.get('page') || '1', 10)
  let limit = parseInt(searchParams.get('limit') || '50', 10)

  // Query Validation
  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 50
  
  const validSorts = ['newest', 'price_asc', 'price_desc', 'name_asc']
  if (!validSorts.includes(sort)) sort = 'newest'
  if (search) search = search.substring(0, 100) // Prevent overly long queries

  const skip = (page - 1) * limit

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy = { basePrice: 'asc' }
  else if (sort === 'price_desc') orderBy = { basePrice: 'desc' }
  else if (sort === 'name_asc') orderBy = { name: 'asc' }

  let whereClause: any = { availableForSale: true }
  
  if (categoryId && categoryId !== 'All') {
    whereClause.OR = [
      { categoryId: categoryId },
      { category: { name: { equals: categoryId, mode: 'insensitive' } } }
    ]
  }

  if (search) {
    whereClause.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy,
      skip,
      take: limit
    }),
    prisma.product.count({ where: whereClause })
  ])

  return NextResponse.json({
    data: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}

export const GET = withApiHandler(handler, true)
