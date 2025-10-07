import { buildSrc } from '@imagekit/next';
import { config } from './config';

// ImageKit utility functions for image optimization and transformation

export interface ImageKitOptions {
  src: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  transformation?: Array<Record<string, any>>;
  queryParameters?: Record<string, string>;
}

/**
 * Generate optimized image URL using ImageKit
 */
export function getOptimizedImageUrl(options: ImageKitOptions): string {
  const { src, width, height, quality = 80, format = 'auto', transformation = [], queryParameters = {} } = options;

  if (!config.imagekit.urlEndpoint) {
    console.warn('ImageKit not configured, returning original URL');
    return src;
  }

  // Build transformation array
  const transformations = [
    ...transformation,
    ...(width ? [{ width }] : []),
    ...(height ? [{ height }] : []),
    ...(quality ? [{ quality }] : []),
    ...(format !== 'auto' ? [{ format }] : [])
  ];

  return buildSrc({
    urlEndpoint: config.imagekit.urlEndpoint,
    src,
    transformation: transformations,
    queryParameters
  });
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(src: string, baseWidth: number = 800): {
  src: string;
  srcSet: string;
  sizes: string;
} {
  const breakpoints = [320, 640, 768, 1024, 1280, 1536];
  const sizes = '(max-width: 640px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 768px, (max-width: 1280px) 1024px, (max-width: 1536px) 1280px, 1536px';
  
  const srcSet = breakpoints
    .map(width => {
      const url = getOptimizedImageUrl({
        src,
        width,
        quality: 80,
        format: 'webp'
      });
      return `${url} ${width}w`;
    })
    .join(', ');

  return {
    src: getOptimizedImageUrl({ src, width: baseWidth }),
    srcSet,
    sizes
  };
}

/**
 * Generate thumbnail URL for video previews
 */
export function getThumbnailUrl(videoUrl: string, width: number = 300, height?: number): string {
  return getOptimizedImageUrl({
    src: videoUrl,
    width,
    height,
    quality: 70,
    format: 'webp',
    transformation: [
      { crop: 'maintain_ratio' },
      { focus: 'auto' }
    ]
  });
}

/**
 * Generate avatar/profile image URL with circular crop
 */
export function getAvatarUrl(src: string, size: number = 100): string {
  return getOptimizedImageUrl({
    src,
    width: size,
    height: size,
    quality: 85,
    format: 'webp',
    transformation: [
      { crop: 'maintain_ratio' },
      { focus: 'face' },
      { radius: 'max' }
    ]
  });
}

/**
 * Generate hero/banner image URL with optimized dimensions
 */
export function getHeroImageUrl(src: string, width: number = 1200, height: number = 600): string {
  return getOptimizedImageUrl({
    src,
    width,
    height,
    quality: 85,
    format: 'webp',
    transformation: [
      { crop: 'maintain_ratio' },
      { focus: 'auto' }
    ]
  });
}

/**
 * Generate image URL with watermark overlay
 */
export function getWatermarkedImageUrl(
  src: string, 
  watermarkText: string, 
  width?: number, 
  height?: number
): string {
  return getOptimizedImageUrl({
    src,
    width,
    height,
    quality: 80,
    format: 'webp',
    transformation: [
      {
        overlayText: watermarkText,
        overlayTextFontSize: 20,
        overlayTextColor: 'FFFFFF',
        overlayTextBackground: '00000080',
        overlayTextPadding: 10,
        overlayPosition: 'bottom_right'
      }
    ]
  });
}

/**
 * Generate image URL with blur effect for loading states
 */
export function getBlurredImageUrl(src: string, width: number = 20, height?: number): string {
  return getOptimizedImageUrl({
    src,
    width,
    height,
    quality: 20,
    format: 'webp',
    transformation: [
      { blur: 10 }
    ]
  });
}

/**
 * Check if URL is an ImageKit URL
 */
export function isImageKitUrl(url: string): boolean {
  return config.imagekit.urlEndpoint ? url.includes(config.imagekit.urlEndpoint) : false;
}

/**
 * Extract file ID from ImageKit URL
 */
export function getImageKitFileId(url: string): string | null {
  if (!isImageKitUrl(url)) return null;
  
  const match = url.match(/\/([^\/\?]+)(?:\?|$)/);
  return match ? match[1] : null;
}

/**
 * Generate ImageKit URL with custom transformations
 */
export function createImageKitUrl(
  fileId: string, 
  transformations: Array<Record<string, any>> = [],
  queryParameters: Record<string, string> = {}
): string {
  if (!config.imagekit.urlEndpoint) {
    throw new Error('ImageKit URL endpoint not configured');
  }

  return buildSrc({
    urlEndpoint: config.imagekit.urlEndpoint,
    src: fileId,
    transformation: transformations,
    queryParameters
  });
}
