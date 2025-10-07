import { logger, logApiCall, generateRequestId } from '../logger';
import { 
  Veo3GenerateRequest, 
  Veo3GenerateResponse, 
  Veo3VideoDetails, 
  PollingConfig 
} from './types';

// Veo3 API Configuration
const VEO3_CONFIG = {
  baseUrl: 'https://api.kie.ai/api/v1/veo',
  creditUrl: 'https://api.kie.ai/api/v1/chat/credit',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * Generate Veo 3 Video
 */
export async function generateVeo3Video(
  request: Veo3GenerateRequest,
  apiKey: string,
  userId?: string
): Promise<Veo3GenerateResponse> {
  const requestId = generateRequestId();
  const url = `${VEO3_CONFIG.baseUrl}/generate`;
  
  const payload = {
    prompt: request.prompt,
    imageUrls: request.imageUrls || [],
    model: request.model || 'veo3_fast',
    watermark: request.watermark || '',
    callBackUrl: request.callBackUrl || '',
    aspectRatio: request.aspectRatio || '9:16',
    seeds: request.seeds || Math.floor(Math.random() * 90000) + 10000,
    enableFallback: request.enableFallback || false,
    enableTranslation: request.enableTranslation || true
  };

  return logApiCall(
    'Generate Veo3 Video',
    async () => {
      logger.debug('Veo3 API Request Payload', {
        prompt: request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''),
        imageUrls: request.imageUrls?.length || 0,
        model: payload.model,
        aspectRatio: payload.aspectRatio,
        enableFallback: payload.enableFallback,
        enableTranslation: payload.enableTranslation,
        hasWatermark: !!payload.watermark,
        hasCallback: !!payload.callBackUrl
      }, requestId, userId);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `API Error ${response.status}: ${errorData.msg || response.statusText}`;
        
        logger.error('Veo3 API Request Failed', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url,
          method: 'POST'
        }, requestId, userId);
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      logger.info('Veo3 Video Generation Started', {
        taskId: result.data?.taskId,
        promptLength: request.prompt.length,
        hasImage: (request.imageUrls?.length || 0) > 0
      }, requestId, userId);

      return result;
    },
    requestId,
    userId,
    {
      promptLength: request.prompt.length,
      aspectRatio: payload.aspectRatio,
      model: payload.model
    }
  );
}

/**
 * Get Veo 3 Video Details
 */
export async function getVeo3VideoDetails(
  taskId: string,
  apiKey: string,
  userId?: string
): Promise<Veo3VideoDetails> {
  const requestId = generateRequestId();
  const url = `${VEO3_CONFIG.baseUrl}/record-info?taskId=${taskId}`;
  
  return logApiCall(
    'Get Veo3 Video Details',
    async () => {
      logger.debug('Fetching video details', { taskId }, requestId, userId);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `API Error ${response.status}: ${errorData.msg || response.statusText}`;
        
        logger.error('Failed to fetch video details', new Error(errorMessage), {
          taskId,
          status: response.status,
          statusText: response.statusText,
          errorData
        }, requestId, userId);
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Debug logging to see actual response structure
      logger.debug('Raw Veo3 API response', {
        taskId,
        rawResponse: result
      }, requestId, userId);
      
      // Map the response to match our expected format
      const status: 'pending' | 'processing' | 'completed' | 'failed' = 
        result.data?.successFlag === 1 ? 'completed' : 
        result.data?.successFlag === 0 ? 'processing' : 
        result.data?.successFlag === 2 ? 'failed' : 'pending';
        
      const mappedResult = {
        code: result.code,
        msg: result.msg,
        data: {
          taskId: result.data?.taskId,
          status,
          videoUrl: result.data?.response?.resultUrls?.[0] || undefined,
          thumbnailUrl: result.data?.response?.thumbnailUrl || undefined,
          duration: result.data?.response?.duration || undefined,
          createdAt: result.data?.createTime || new Date().toISOString(),
          completedAt: result.data?.completeTime || undefined
        }
      };
      
      logger.info('Video details retrieved', {
        taskId,
        status: mappedResult.data.status,
        hasVideoUrl: !!mappedResult.data.videoUrl,
        hasThumbnail: !!mappedResult.data.thumbnailUrl,
        duration: mappedResult.data.duration
      }, requestId, userId);

      return mappedResult;
    },
    requestId,
    userId,
    { taskId }
  );
}

/**
 * Poll Video Status until completion
 */
export async function pollVideoStatus(
  taskId: string,
  apiKey: string,
  userId?: string,
  config: PollingConfig = { maxAttempts: 30, intervalMs: 10000 }
): Promise<Veo3VideoDetails> {
  const requestId = generateRequestId();
  
  logger.info('Starting video status polling', {
    taskId,
    maxAttempts: config.maxAttempts,
    intervalMs: config.intervalMs
  }, requestId, userId);

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const details = await getVeo3VideoDetails(taskId, apiKey, userId);
      
      if (details.data.status === 'completed') {
        logger.info('Video generation completed', {
          taskId,
          attempts: attempt,
          videoUrl: details.data.videoUrl
        }, requestId, userId);
        return details;
      }
      
      if (details.data.status === 'failed') {
        logger.error('Video generation failed', new Error('Video generation failed'), {
          taskId,
          attempts: attempt
        }, requestId, userId);
        throw new Error('Video generation failed');
      }
      
      logger.debug('Video still processing', {
        taskId,
        status: details.data.status,
        attempt,
        maxAttempts: config.maxAttempts
      }, requestId, userId);
      
      if (attempt < config.maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, config.intervalMs));
      }
    } catch (error) {
      logger.error('Error during status polling', error as Error, {
        taskId,
        attempt,
        maxAttempts: config.maxAttempts
      }, requestId, userId);
      
      if (attempt === config.maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, config.intervalMs));
    }
  }
  
  throw new Error(`Video generation timed out after ${config.maxAttempts} attempts`);
}

/**
 * Get 1080P Video (only for 16:9 aspect ratio)
 */
export async function getVeo31080PVideo(
  taskId: string,
  apiKey: string,
  userId?: string
): Promise<{ videoUrl: string }> {
  const requestId = generateRequestId();
  const url = `${VEO3_CONFIG.baseUrl}/1080p/${taskId}`;
  
  return logApiCall(
    'Get Veo3 1080P Video',
    async () => {
      logger.debug('Fetching 1080P video', { taskId }, requestId, userId);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `API Error ${response.status}: ${errorData.msg || response.statusText}`;
        
        logger.error('Failed to fetch 1080P video', new Error(errorMessage), {
          taskId,
          status: response.status,
          statusText: response.statusText,
          errorData
        }, requestId, userId);
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      logger.info('1080P video retrieved', {
        taskId,
        videoUrl: result.videoUrl
      }, requestId, userId);

      return result;
    },
    requestId,
    userId,
    { taskId }
  );
}

/**
 * Validate Veo3 request parameters
 */
export function validateVeo3Request(request: Veo3GenerateRequest): void {
  if (!request.prompt || request.prompt.trim().length < 10) {
    throw new Error('Prompt must be at least 10 characters long');
  }

  if (request.prompt.length > 1000) {
    throw new Error('Prompt must be less than 1000 characters');
  }

  if (request.aspectRatio && !['16:9', '9:16'].includes(request.aspectRatio)) {
    throw new Error('Aspect ratio must be either 16:9 or 9:16');
  }

  if (request.seeds && (request.seeds < 10000 || request.seeds > 99999)) {
    throw new Error('Seeds must be between 10000 and 99999');
  }

  if (request.imageUrls && request.imageUrls.length > 1) {
    throw new Error('Only one image URL is supported');
  }
}

/**
 * Get remaining credits from Kie API
 */
export async function getKieCredits(apiKey: string): Promise<number> {
  const requestId = generateRequestId();
  const url = VEO3_CONFIG.creditUrl;
  
  return await logApiCall('Get Kie Credits', async () => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(VEO3_CONFIG.timeout)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${data.msg || response.statusText}`);
    }

    if (data.code !== 200) {
      throw new Error(`API Error ${data.code}: ${data.msg}`);
    }

    return data.data;
  }, requestId);
}
