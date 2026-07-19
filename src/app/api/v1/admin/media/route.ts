import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mediaService } from '@/lib/media/CloudinaryMediaProvider'
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler'
import crypto from 'crypto'
import { Role } from '@prisma/client'

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  const { req } = ctx
  const { searchParams } = new URL(req.url)
  const folder = searchParams.get('folder')

  const whereClause = folder ? { folder } : {}
  const assets = await prisma.mediaAsset.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { id: true, name: true, email: true } }
    }
  })

  return NextResponse.json(assets)
}, false, 'manage_products') // Using manage_products as capability for media

export const POST = withApiHandler(async (ctx: HandlerContext) => {
  const { req, user } = ctx
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = formData.get('folder') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Convert file to base64 string for Cloudinary
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Compute SHA-256 Hash for duplicate detection
  const imageHash = crypto.createHash('sha256').update(buffer).digest('hex')

  // Check if the hash already exists in Designs (only if we are uploading to catalog/designs)
  const targetFolder = folder || 'catalog/designs'
  if (targetFolder === 'catalog/designs') {
    const existingDesign = await prisma.design.findFirst({ where: { imageHash } })
    
    // If we find a duplicate, and the user hasn't explicitly bypassed it (we could support a bypass flag)
    const forceUpload = formData.get('force') === 'true'
    if (existingDesign && !forceUpload) {
      return NextResponse.json({ 
        error: 'Possible duplicate detected.', 
        isDuplicate: true, 
        existingDesignId: existingDesign.id 
      }, { status: 409 })
    }
  }

  const base64File = `data:${file.type};base64,${buffer.toString('base64')}`

  // Upload to Cloudinary via Provider
  const uploadedAsset = await mediaService.upload(base64File, {
    folder: targetFolder,
    format: 'auto',
    crop: 'limit',
    width: 1920,
    height: 1920
  })

  // Record in database
  const dbAsset = await prisma.mediaAsset.create({
    data: {
      id: uploadedAsset.id,
      url: uploadedAsset.url,
      format: uploadedAsset.format,
      width: uploadedAsset.width,
      height: uploadedAsset.height,
      bytes: uploadedAsset.bytes,
      provider: uploadedAsset.provider,
      folder: targetFolder,
      uploadedById: user.id
    }
  })

  return NextResponse.json({ ...dbAsset, imageHash }, { status: 201 })
}, false, 'manage_products')
