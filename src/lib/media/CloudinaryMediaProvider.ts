import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { MediaService, MediaAsset, UploadOptions } from './MediaService'

// Configure cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

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
      const result = await cloudinary.uploader.destroy(assetId)
      return result.result === 'ok'
    } catch (error: any) {
      throw new Error(`Cloudinary delete failed: ${error.message || error}`)
    }
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
