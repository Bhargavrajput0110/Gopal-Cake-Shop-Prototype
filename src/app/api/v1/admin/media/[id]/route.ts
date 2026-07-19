import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mediaService } from '@/lib/media/CloudinaryMediaProvider'
import { auth } from '@/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assetId } = await params // Note: public_id might contain slashes which are URL encoded.
    const decodedId = decodeURIComponent(assetId)

    // Check if it exists in our DB
    const dbAsset = await prisma.mediaAsset.findUnique({
      where: { id: decodedId }
    })

    if (!dbAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Delete from Provider
    await mediaService.delete(decodedId)

    // Delete from Database
    await prisma.mediaAsset.delete({
      where: { id: decodedId }
    })

    return NextResponse.json({ success: true, message: 'Asset deleted' })
  } catch (error: any) {
    console.error('Media Delete Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
