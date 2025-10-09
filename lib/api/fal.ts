import { fal } from "@fal-ai/client";
import { logger, logApiCall, generateRequestId } from '../logger';

// Configure FAL client
fal.config({
  credentials: process.env.FAL_API_KEY
});

// Types for FAL AI Nano Banana API
export interface FalImageGenerationInput {
  prompt: string;
  num_images?: number;
  output_format?: 'jpeg' | 'png';
  aspect_ratio?: '21:9' | '1:1' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '3:4' | '16:9' | '9:16';
  sync_mode?: boolean;
}

export interface FalImageFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface FalImageGenerationOutput {
  images: FalImageFile[];
  description: string;
}

export interface FalImageGenerationResult {
  data: FalImageGenerationOutput;
  requestId: string;
}

export interface FalQueueStatus {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  logs?: Array<{ message: string; timestamp: string }>;
  error?: string;
}

/**
 * Generate images using FAL AI Nano Banana model
 * @param input - Image generation parameters
 * @returns Promise with generated images and metadata
 */
export async function generateImages(input: FalImageGenerationInput): Promise<FalImageGenerationResult> {
  const requestId = generateRequestId();
  
  return await logApiCall('FAL AI Image Generation', async () => {
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt: input.prompt,
        num_images: input.num_images || 1,
        output_format: input.output_format || 'jpeg',
        aspect_ratio: input.aspect_ratio || '1:1',
        sync_mode: input.sync_mode || false
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((message) => {
            logger.debug('FAL AI Generation Log', { message, requestId });
          });
        }
      },
    });

    return {
      data: result.data,
      requestId: result.requestId
    };
  }, requestId);
}

/**
 * Submit image generation request to queue (for long-running requests)
 * @param input - Image generation parameters
 * @param webhookUrl - Optional webhook URL for results
 * @returns Promise with request ID
 */
export async function submitImageGenerationRequest(
  input: FalImageGenerationInput, 
  webhookUrl?: string
): Promise<{ request_id: string }> {
  const requestId = generateRequestId();
  
  return await logApiCall('FAL AI Queue Submit', async () => {
    const result = await fal.queue.submit("fal-ai/nano-banana", {
      input: {
        prompt: input.prompt,
        num_images: input.num_images || 1,
        output_format: input.output_format || 'jpeg',
        aspect_ratio: input.aspect_ratio || '1:1',
        sync_mode: input.sync_mode || false
      },
      webhookUrl
    });

    return result;
  }, requestId);
}

/**
 * Check the status of a queued image generation request
 * @param requestId - The request ID to check
 * @param includeLogs - Whether to include logs in the response
 * @returns Promise with request status
 */
export async function getImageGenerationStatus(
  requestId: string, 
  includeLogs: boolean = true
): Promise<FalQueueStatus> {
  return await logApiCall('FAL AI Queue Status', async () => {
    const status = await fal.queue.status("fal-ai/nano-banana", {
      requestId,
      logs: includeLogs
    });

    return status;
  }, requestId);
}

/**
 * Get the result of a completed image generation request
 * @param requestId - The request ID to get results for
 * @returns Promise with generated images and metadata
 */
export async function getImageGenerationResult(requestId: string): Promise<FalImageGenerationResult> {
  return await logApiCall('FAL AI Queue Result', async () => {
    const result = await fal.queue.result("fal-ai/nano-banana", {
      requestId
    });

    return {
      data: result.data,
      requestId: result.requestId
    };
  }, requestId);
}

/**
 * Upload a file to FAL storage
 * @param file - The file to upload
 * @returns Promise with file URL
 */
export async function uploadFileToFal(file: File): Promise<string> {
  const requestId = generateRequestId();
  
  return await logApiCall('FAL AI File Upload', async () => {
    const url = await fal.storage.upload(file);
    return url;
  }, requestId);
}

/**
 * Generate images with specific aspect ratio for video generation
 * @param prompt - Text prompt for image generation
 * @param aspectRatio - Aspect ratio matching video requirements
 * @param numImages - Number of images to generate (default: 1)
 * @returns Promise with generated images
 */
export async function generateVideoThumbnails(
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9',
  numImages: number = 1
): Promise<FalImageGenerationResult> {
  return await generateImages({
    prompt,
    num_images: numImages,
    output_format: 'jpeg',
    aspect_ratio: aspectRatio,
    sync_mode: false
  });
}

/**
 * Generate a single image with optimized settings
 * @param prompt - Text prompt for image generation
 * @param aspectRatio - Aspect ratio for the image
 * @returns Promise with generated image URL
 */
export async function generateSingleImage(
  prompt: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '1:1'
): Promise<string> {
  const result = await generateImages({
    prompt,
    num_images: 1,
    output_format: 'jpeg',
    aspect_ratio: aspectRatio,
    sync_mode: true // Use sync mode for single images
  });

  if (result.data.images.length === 0) {
    throw new Error('No images generated');
  }

  return result.data.images[0].url;
}

/**
 * Generate an image from another image (image-to-image editing)
 * Uses FAL AI's Nano Banana Edit model
 * @param prompt - Text prompt for image transformation
 * @param imageUrl - URL of the reference image
 * @param aspectRatio - Aspect ratio for the output image
 * @returns Promise with generated image URL
 */
export async function generateImageFromImage(
  prompt: string,
  imageUrl: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '1:1'
): Promise<string> {
  const requestId = generateRequestId();
  
  return await logApiCall('FAL AI Image-to-Image Generation', async () => {
    const result = await fal.subscribe("fal-ai/nano-banana/edit", {
      input: {
        prompt,
        image_urls: [imageUrl], // nano-banana/edit expects an array
        num_images: 1,
        output_format: 'jpeg',
        aspect_ratio: aspectRatio,
        sync_mode: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach((message) => {
            logger.debug('FAL AI Image-to-Image Generation Log', { message, requestId });
          });
        }
      },
    });

    if (!result.data?.images?.[0]?.url) {
      throw new Error('No images generated from image-to-image');
    }

    return result.data.images[0].url;
  }, requestId);
}

/**
 * Validate FAL API configuration
 * @returns Promise with validation result
 */
export async function validateFalConfiguration(): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!process.env.FAL_API_KEY) {
      return { valid: false, error: 'FAL_API_KEY environment variable is not set' };
    }

    // Test with a simple request
    await generateImages({
      prompt: 'test image',
      num_images: 1,
      sync_mode: true
    });

    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      error: error.message || 'Failed to validate FAL API configuration' 
    };
  }
}
