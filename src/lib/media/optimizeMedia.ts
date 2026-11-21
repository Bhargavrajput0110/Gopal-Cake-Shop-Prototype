/**
 * Universal media optimization utility for Gopal Cake Shop.
 * Automatically injects auto-format, auto-quality, and size-capping
 * transformations for Cloudinary & Unsplash assets to minimize bandwidth usage.
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number | 'auto' | 'auto:eco' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'webp' | 'avif';
  crop?: 'limit' | 'fill' | 'fit' | 'thumb';
}

interface VideoOptimizationOptions {
  width?: number;
  quality?: 'auto' | 'auto:eco' | 'auto:good';
  format?: 'auto' | 'mp4' | 'webm';
}

/**
 * Optimizes an image URL from Cloudinary, Unsplash, or local assets.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';

  const {
    width = 800,
    height,
    quality = 'auto',
    format = 'auto',
    crop = height ? 'fill' : 'limit'
  } = options;

  // Cloudinary Optimization
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    // If transformations already exist, return or preserve
    if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/q_auto')) {
      return url;
    }

    const transformParts = [
      `f_${format}`,
      `q_${quality}`,
      `w_${width}`,
      height ? `h_${height}` : '',
      `c_${crop}`,
    ].filter(Boolean).join(',');

    return url.replace('/image/upload/', `/image/upload/${transformParts}/`);
  }

  // Unsplash Optimization
  if (url.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.searchParams.set('auto', 'format');
      parsedUrl.searchParams.set('fit', 'crop');
      parsedUrl.searchParams.set('q', typeof quality === 'number' ? String(quality) : '75');
      parsedUrl.searchParams.set('w', String(width));
      if (height) parsedUrl.searchParams.set('h', String(height));
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Optimizes a video URL from Cloudinary (serves compressed AV1/VP9/WebM with dynamic bitrate).
 */
export function getOptimizedVideoUrl(
  url?: string | null,
  options: VideoOptimizationOptions = {}
): string {
  if (!url) return '';

  const { width = 720, quality = 'auto', format = 'auto' } = options;

  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    if (url.includes('/video/upload/f_auto') || url.includes('/video/upload/q_auto')) {
      return url;
    }

    const transform = `f_${format}:video,q_${quality},w_${width},c_limit`;
    return url.replace('/video/upload/', `/video/upload/${transform}/`);
  }

  return url;
}

/**
 * Generates a lightweight static poster image from the first frame of a Cloudinary video.
 */
export function getVideoPosterUrl(
  url?: string | null,
  options: { width?: number } = {}
): string {
  if (!url) return '';
  const { width = 480 } = options;

  if (url.includes('res.cloudinary.com') && url.includes('/video/upload/')) {
    // Convert .mp4 extension to .jpg with frame 0 (so_0) capture
    const baseUrl = url.replace(/\.[a-zA-Z0-9]+$/, '.jpg');
    const transform = `so_0,f_auto,q_auto,w_${width},c_limit`;
    return baseUrl.replace('/video/upload/', `/video/upload/${transform}/`);
  }

  return '';
}
