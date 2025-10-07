import { logger, logApiCall, generateRequestId } from '../logger';
import { 
  ImageKitUploadResponse, 
  ImageKitUploadOptions, 
  FileValidationResult,
  UploadProgress 
} from './types';

// ImageKit API Configuration
const IMAGEKIT_CONFIG = {
  uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
  baseUrl: 'https://api.imagekit.io/v1',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  defaultFolder: '/video-generation/'
};

/**
 * Validate file before upload
 */
export function validateImageFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push(`Invalid file type: ${file.type}. Only image files are allowed.`);
  } else if (!IMAGEKIT_CONFIG.allowedTypes.includes(file.type)) {
    errors.push(`Unsupported image type: ${file.type}. Supported types: ${IMAGEKIT_CONFIG.allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > IMAGEKIT_CONFIG.maxFileSize) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${(IMAGEKIT_CONFIG.maxFileSize / 1024 / 1024)}MB limit`);
  }

  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File name is required');
  }

  // Warnings
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push('Large file size may result in slower upload');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate ImageKit authentication token
 */
function generateImageKitToken(privateKey: string, tokenData: { token: string; expire: number; signature: string }) {
  const crypto = require('crypto');
  
  // Create the signature string
  const signatureString = `${tokenData.token}${tokenData.expire}`;
  
  // Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(signatureString)
    .digest('hex');

  return {
    ...tokenData,
    signature
  };
}

/**
 * Upload image to ImageKit using direct API
 */
export async function uploadImageToUrl(
  file: File, 
  userId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const requestId = generateRequestId();
  
  return logApiCall(
    'Upload Image to ImageKit',
    async () => {
      logger.debug('Starting ImageKit upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }, requestId, userId);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        logger.warn('File validation warnings', { warnings: validation.warnings }, requestId, userId);
      }

      // Get ImageKit configuration from environment
      const imagekitUrlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
      const imagekitPublicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
      const imagekitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;

      if (!imagekitUrlEndpoint || !imagekitPublicKey || !imagekitPrivateKey) {
        throw new Error('ImageKit configuration missing. Please set NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT, NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_PRIVATE_KEY environment variables.');
      }

      // Generate authentication token for ImageKit
      const token = generateImageKitToken(imagekitPrivateKey, {
        token: Math.random().toString(36).substring(2, 15),
        expire: Math.floor(Date.now() / 1000) + 2400, // 40 minutes
        signature: ''
      });

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('publicKey', imagekitPublicKey);
      formData.append('signature', token.signature);
      formData.append('expire', token.expire.toString());
      formData.append('token', token.token);
      
      // Add optional metadata
      if (userId) {
        formData.append('tags', `user-${userId},video-reference`);
      }
      formData.append('folder', IMAGEKIT_CONFIG.defaultFolder);

      logger.debug('Uploading to ImageKit', {
        fileName: file.name,
        fileSize: file.size,
        hasUserId: !!userId
      }, requestId, userId);

      // Upload to ImageKit with progress tracking
      const response = await fetch(IMAGEKIT_CONFIG.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `ImageKit upload failed: ${response.status} ${response.statusText}`;
        
        logger.error('ImageKit upload failed', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData,
          fileName: file.name
        }, requestId, userId);
        
        throw new Error(errorMessage);
      }

      const uploadResult = await response.json();
      
      logger.info('Image uploaded successfully to ImageKit', {
        fileId: uploadResult.fileId,
        fileName: uploadResult.name,
        fileSize: uploadResult.size,
        url: uploadResult.url
      }, requestId, userId);

      return uploadResult.url;
    },
    requestId,
    userId,
    {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }
  );
}

/**
 * Upload image using ImageKit SDK
 */
export async function uploadImageWithSDK(
  file: File, 
  userId?: string,
  options: Partial<ImageKitUploadOptions> = {}
): Promise<ImageKitUploadResponse> {
  const requestId = generateRequestId();
  
  return logApiCall(
    'Upload Image with ImageKit SDK',
    async () => {
      logger.debug('Starting ImageKit SDK upload', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }, requestId, userId);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
      }

      // Import ImageKit SDK dynamically
      const ImageKit = require('@imagekit/next');
      
      const imagekit = new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
      });

      // Convert File to Buffer for SDK
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadOptions: ImageKitUploadOptions = {
        file: buffer,
        fileName: options.fileName || file.name,
        folder: options.folder || IMAGEKIT_CONFIG.defaultFolder,
        tags: options.tags || (userId ? [`user-${userId}`, 'video-reference'] : ['video-reference']),
        useUniqueFileName: options.useUniqueFileName ?? true,
        customCoordinates: options.customCoordinates,
        isPrivateFile: options.isPrivateFile ?? false,
        customMetadata: options.customMetadata
      };

      logger.debug('Uploading with ImageKit SDK', {
        fileName: uploadOptions.fileName,
        folder: uploadOptions.folder,
        tags: uploadOptions.tags
      }, requestId, userId);

      const result = await imagekit.upload(uploadOptions);
      
      logger.info('Image uploaded successfully with ImageKit SDK', {
        fileId: result.fileId,
        fileName: result.name,
        fileSize: result.size,
        url: result.url
      }, requestId, userId);

      return result;
    },
    requestId,
    userId,
    {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    }
  );
}

/**
 * Delete image from ImageKit
 */
export async function deleteImageFromImageKit(
  fileId: string,
  userId?: string
): Promise<boolean> {
  const requestId = generateRequestId();
  
  return logApiCall(
    'Delete Image from ImageKit',
    async () => {
      logger.debug('Deleting image from ImageKit', { fileId }, requestId, userId);

      const ImageKit = require('@imagekit/next');
      
      const imagekit = new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
      });

      await imagekit.deleteFile(fileId);
      
      logger.info('Image deleted successfully from ImageKit', {
        fileId
      }, requestId, userId);

      return true;
    },
    requestId,
    userId,
    { fileId }
  );
}

/**
 * Get image details from ImageKit
 */
export async function getImageDetails(
  fileId: string,
  userId?: string
): Promise<ImageKitUploadResponse> {
  const requestId = generateRequestId();
  
  return logApiCall(
    'Get Image Details from ImageKit',
    async () => {
      logger.debug('Getting image details from ImageKit', { fileId }, requestId, userId);

      const ImageKit = require('@imagekit/next');
      
      const imagekit = new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
      });

      const result = await imagekit.getFileDetails(fileId);
      
      logger.info('Image details retrieved from ImageKit', {
        fileId,
        fileName: result.name,
        fileSize: result.size
      }, requestId, userId);

      return result;
    },
    requestId,
    userId,
    { fileId }
  );
}

/**
 * List images from ImageKit folder
 */
export async function listImagesInFolder(
  folderPath: string = IMAGEKIT_CONFIG.defaultFolder,
  userId?: string,
  limit: number = 50
): Promise<ImageKitUploadResponse[]> {
  const requestId = generateRequestId();
  
  return logApiCall(
    'List Images in ImageKit Folder',
    async () => {
      logger.debug('Listing images in ImageKit folder', { folderPath, limit }, requestId, userId);

      const ImageKit = require('@imagekit/next');
      
      const imagekit = new ImageKit({
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
      });

      const result = await imagekit.listFiles({
        path: folderPath,
        limit
      });
      
      logger.info('Images listed from ImageKit folder', {
        folderPath,
        count: result.length
      }, requestId, userId);

      return result;
    },
    requestId,
    userId,
    { folderPath, limit }
  );
}
