import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { MediaService, MediaAsset, UploadOptions } from './MediaService'

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

/**
 * Extracts the Cloudinary public_id from a full CDN URL.
 * Supports versioned URLs, unversioned URLs, and URLs with transformation segments.
 * Strips the file extension as required by the Cloudinary Destroy API.
 */
export function extractCloudinaryPublicId(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  if (!url.includes('cloudinary.com')) return null

  try {
    const uploadIndex = url.indexOf('/upload/')
    if (uploadIndex === -1) return null

    // Get everything after '/upload/'
    const afterUpload = url.slice(uploadIndex + '/upload/'.length)

    // Split path into segments
    const segments = afterUpload.split('/')
    let startIdx = 0

    // Skip transformation segments and version segment (e.g. v1794636080)
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      // Version segment: starts with 'v' followed by digits only
      if (/^v\d+$/.test(seg)) {
        startIdx = i + 1
        break
      }
      // Common transformations: contains comma (e.g. "w_400,c_fill") or common transformation flags
      if (seg.includes(',') || /^[a-z]{1,3}_[a-zA-Z0-9_-]+$/.test(seg)) {
        startIdx = i + 1
      }
    }

    const remainingSegments = segments.slice(startIdx)
    if (remainingSegments.length === 0) return null

    let publicIdWithExt = remainingSegments.join('/')
    // Remove query params or hash if any
    publicIdWithExt = publicIdWithExt.split('?')[0].split('#')[0]

    // Remove file extension (e.g., .jpg, .png, .webp)
    const lastDotIndex = publicIdWithExt.lastIndexOf('.')
    if (lastDotIndex > 0) {
      return publicIdWithExt.slice(0, lastDotIndex)
    }
    return publicIdWithExt
  } catch {
    return null
  }
}

export class CloudinaryMediaProvider implements MediaService {
  /**
   * Uploads a file (base64 string) to Cloudinary.
   */
  async upload(file: string, options?: UploadOptions): Promise<MediaAsset> {
    const allowedFolders = [
      'catalog/products', 
      'catalog/designs', 
      'orders/customer-reference', 
      'orders/photo-cake', 
      'orders/production', 
      'website/banners', 
      'website/assets'
    ]
    const folder = options?.folder || 'catalog/designs'
    
    if (!allowedFolders.includes(folder)) {
      throw new Error(`Invalid folder. Allowed folders are: ${allowedFolders.join(', ')}`)
    }

    const cloudinaryOptions: any = {
      folder,
      tags: options?.tags,
    }

    if (options?.format) {
      cloudinaryOptions.format = options.format
    } else {
      cloudinaryOptions.format = 'auto'
    }

    if (options?.width || options?.height) {
      cloudinaryOptions.transformation = [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'limit',
          quality: 'auto',
          fetch_format: 'auto'
        }
      ]
    } else {
      // Default auto optimization
      cloudinaryOptions.transformation = [
        { quality: 'auto', fetch_format: 'auto' }
      ]
    }

    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(file, cloudinaryOptions)
      return this.mapToMediaAsset(result)
    } catch (error: any) {
      throw new Error(`Cloudinary upload failed: ${error.message || error}`)
    }
  }

  /**
   * Deletes a file from Cloudinary by its public_id.
   */
  async delete(assetId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(assetId, { invalidate: true })
      return result.result === 'ok' || result.result === 'not found'
    } catch (error: any) {
      console.error(`Cloudinary delete failed for ${assetId}:`, error?.message || error)
      return false
    }
  }

  /**
   * Deletes a file from Cloudinary by its full URL.
   */
  async deleteByUrl(url: string): Promise<boolean> {
    const publicId = extractCloudinaryPublicId(url)
    if (!publicId) return false
    return this.delete(publicId)
  }

  /**
   * Lists assets optionally filtered by folder.
   * Note: Cloudinary Admin API requires API secret and is rate-limited.
   * For the free tier, we will use the `search` API.
   */
  async list(folder?: string, limit: number = 50): Promise<MediaAsset[]> {
    try {
      let expression = 'resource_type:image'
      if (folder) {
        expression += ` AND folder:${folder}`
      }

      const result = await cloudinary.search
        .expression(expression)
        .sort_by('created_at', 'desc')
        .max_results(limit)
        .execute()

      return result.resources.map((res: any) => this.mapToMediaAsset(res))
    } catch (error: any) {
      throw new Error(`Cloudinary list failed: ${error.message || error}`)
    }
  }

  private mapToMediaAsset(result: any): MediaAsset {
    return {
      id: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      provider: 'cloudinary'
    }
  }
}

// Export a singleton instance for use across the application
export const mediaService: MediaService = new CloudinaryMediaProvider()
