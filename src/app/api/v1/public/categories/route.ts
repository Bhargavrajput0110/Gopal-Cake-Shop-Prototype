import { NextResponse } from 'next/server'
import { withApiHandler } from '@/lib/withApiHandler'
import { CatalogService } from '@/services/CatalogService'

export const GET = withApiHandler(async () => {
  const categories = await CatalogService.listCategories()
  // Map to UI expectations
  const mapped = categories
    .filter(c => c.isActive)
    .map(c => ({
      ...c,
      categoryId: c.slug,
      status: 'active'
    }))
  return NextResponse.json(mapped)
}, true)
