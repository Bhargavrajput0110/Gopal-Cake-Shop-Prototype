export interface UploadOptions {
  folder?: string
  tags?: string[]
  width?: number
  height?: number
  crop?: 'fill' | 'scale' | 'fit' | 'limit' | 'thumb'
  format?: 'jpg' | 'png' | 'webp' | 'auto'
}

export interface MediaAsset {
  id: string // Provider's unique ID for the asset
  url: string // Public URL for the asset
  format: string
  width: number
  height: number
  bytes: number
  provider: string // e.g. 'cloudinary', 's3'
}

export interface MediaService {
  /**
   * Uploads a file buffer or base64 string to the media provider.
   */
  upload(file: string | Buffer, options?: UploadOptions): Promise<MediaAsset>

  /**
   * Deletes a file from the media provider by its unique ID.
   */
  delete(assetId: string): Promise<boolean>

  /**
   * Lists assets optionally filtered by folder or tag.
   */
  list(folder?: string, limit?: number): Promise<MediaAsset[]>
}
