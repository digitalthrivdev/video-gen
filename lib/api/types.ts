// Shared API types for Kie.ai and ImageKit integration

// Veo 3 API Types
export interface Veo3GenerateRequest {
  prompt: string;
  imageUrls?: string[];
  model?: 'veo3_fast';
  watermark?: string;
  callBackUrl?: string;
  aspectRatio?: '16:9' | '9:16';
  seeds?: number;
  enableFallback?: boolean;
  enableTranslation?: boolean;
}

export interface Veo3GenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface Veo3VideoDetails {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    videoUrl?: string;
    thumbnailUrl?: string;
    duration?: number;
    createdAt: string;
    completedAt?: string;
  };
}

// ImageKit API Types
export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  fileType: string;
  filePath: string;
  tags?: string[];
  isPrivateFile: boolean;
  customCoordinates?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageKitUploadOptions {
  file: File | Buffer;
  fileName: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
  customCoordinates?: string;
  isPrivateFile?: boolean;
  customMetadata?: Record<string, any>;
}

// Common API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: any;
  requestId?: string;
}

// Polling Configuration
export interface PollingConfig {
  maxAttempts: number;
  intervalMs: number;
  timeoutMs?: number;
}

// Upload Progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Video Generation Status
export type VideoGenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// File Validation
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}
