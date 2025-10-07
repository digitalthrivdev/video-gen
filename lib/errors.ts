import { logger } from './logger';

// Custom error classes for better error handling
export class Veo3ApiError extends Error {
  public readonly statusCode: number;
  public readonly requestId?: string;
  public readonly userId?: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number,
    requestId?: string,
    userId?: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'Veo3ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.userId = userId;
    this.context = context;

    // Log the error
    logger.error(message, this, context, requestId, userId);
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: any;

  constructor(field: string, value: any, message?: string) {
    super(message || `Validation failed for field: ${field}`);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;

    logger.warn('Validation error', { field, value, message });
  }
}

export class FileUploadError extends Error {
  public readonly fileName: string;
  public readonly fileSize: number;
  public readonly fileType: string;

  constructor(fileName: string, fileSize: number, fileType: string, message: string) {
    super(message);
    this.name = 'FileUploadError';
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.fileType = fileType;

    logger.error('File upload error', this, { fileName, fileSize, fileType });
  }
}

export class VideoGenerationError extends Error {
  public readonly taskId: string;
  public readonly status: string;
  public readonly attempts: number;

  constructor(taskId: string, status: string, attempts: number, message: string) {
    super(message);
    this.name = 'VideoGenerationError';
    this.taskId = taskId;
    this.status = status;
    this.attempts = attempts;

    logger.error('Video generation error', this, { taskId, status, attempts });
  }
}

// Error handling utilities
export function handleApiError(error: any, requestId?: string, userId?: string): never {
  if (error instanceof Veo3ApiError) {
    throw error;
  }

  if (error instanceof Response) {
    // Handle fetch Response errors
    const statusCode = error.status;
    const statusText = error.statusText;
    
    throw new Veo3ApiError(
      `API request failed: ${statusCode} ${statusText}`,
      statusCode,
      requestId,
      userId,
      { statusCode, statusText }
    );
  }

  if (error instanceof Error) {
    // Handle generic errors
    throw new Veo3ApiError(
      error.message,
      500,
      requestId,
      userId,
      { originalError: error.name }
    );
  }

  // Handle unknown errors
  throw new Veo3ApiError(
    'An unknown error occurred',
    500,
    requestId,
    userId,
    { originalError: String(error) }
  );
}

// Validation utilities
export function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new ValidationError('prompt', prompt, 'Prompt is required and must be a string');
  }

  if (prompt.trim().length < 10) {
    throw new ValidationError('prompt', prompt, 'Prompt must be at least 10 characters long');
  }

  if (prompt.length > 1000) {
    throw new ValidationError('prompt', prompt, 'Prompt must be less than 1000 characters');
  }
}

export function validateAspectRatio(aspectRatio: string): void {
  const validRatios = ['16:9', '9:16'];
  if (!validRatios.includes(aspectRatio)) {
    throw new ValidationError('aspectRatio', aspectRatio, `Aspect ratio must be one of: ${validRatios.join(', ')}`);
  }
}

export function validateImageFile(file: File): void {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    throw new FileUploadError(
      file.name,
      file.size,
      file.type,
      `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of 10MB`
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new FileUploadError(
      file.name,
      file.size,
      file.type,
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
}

export function validateApiKey(apiKey: string): void {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new ValidationError('apiKey', apiKey, 'API key is required and must be a string');
  }

  if (!apiKey.startsWith('Bearer ') && !apiKey.startsWith('sk-')) {
    throw new ValidationError('apiKey', '***', 'API key must start with "Bearer " or "sk-"');
  }
}

// Error response formatter for API endpoints
export function formatErrorResponse(error: Error, requestId?: string) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Veo3ApiError) {
    return {
      error: {
        type: 'Veo3ApiError',
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId || requestId,
        ...(isDevelopment && { context: error.context })
      }
    };
  }

  if (error instanceof ValidationError) {
    return {
      error: {
        type: 'ValidationError',
        message: error.message,
        field: error.field,
        requestId,
        ...(isDevelopment && { value: error.value })
      }
    };
  }

  if (error instanceof FileUploadError) {
    return {
      error: {
        type: 'FileUploadError',
        message: error.message,
        fileName: error.fileName,
        fileSize: error.fileSize,
        fileType: error.fileType,
        requestId
      }
    };
  }

  if (error instanceof VideoGenerationError) {
    return {
      error: {
        type: 'VideoGenerationError',
        message: error.message,
        taskId: error.taskId,
        status: error.status,
        attempts: error.attempts,
        requestId
      }
    };
  }

  // Generic error
  return {
    error: {
      type: 'InternalError',
      message: isDevelopment ? error.message : 'An internal error occurred',
      requestId,
      ...(isDevelopment && { stack: error.stack })
    }
  };
}
