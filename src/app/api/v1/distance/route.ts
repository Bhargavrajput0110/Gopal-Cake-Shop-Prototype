import { NextResponse } from 'next/server'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import { prisma } from '@/lib/prisma'
import { DistanceFactory } from '@/services/distance/DistanceFactory'
import { z } from 'zod'
import { toBranchId } from '@/lib/branches'

const DistanceQuerySchema = z.object({
  branchId: z.string().min(1),
  destination: z.string().min(5),
})

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  const { req } = ctx
  const { searchParams } = new URL(req.url)
  
  const branchId = searchParams.get('branchId') || ''
  const destination = searchParams.get('destination') || ''

  try {
    const data = DistanceQuerySchema.parse({ branchId, destination })
    
    // Convert to canonical branch ID
    const canonicalBranchId = toBranchId(data.branchId)

    // Fetch the origin branch address from DB
    const branch = await prisma.branch.findUnique({
      where: { code: canonicalBranchId } // wait, schema says 'id' or 'code'? We'll check both.
    }) || await prisma.branch.findFirst({
      where: {
        OR: [
          { id: canonicalBranchId },
          { name: { contains: canonicalBranchId, mode: 'insensitive' } }
        ]
      }
    })

    let originAddress = ''
    if (branch && branch.address) {
      originAddress = `${branch.address}, ${branch.name}, Vadodara, Gujarat`
    } else {
      // Fallback if branch is missing in DB but exists in branches.ts
      originAddress = `${canonicalBranchId} branch, Vadodara, Gujarat`
    }

    // Call the distance provider (Google Maps)
    const provider = DistanceFactory.getProvider()
    const result = await provider.calculateDistance(originAddress, data.destination)

    return NextResponse.json({
      success: true,
      data: {
        origin: originAddress,
        destination: data.destination,
        distanceKm: result.distanceKm,
        isFarDistance: result.isFarDistance
      }
    })

  } catch (error: any) {
    console.error('[Distance API] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: (error as any).errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || 'Failed to calculate distance' }, { status: 500 })
  }
})
