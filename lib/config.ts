// Environment configuration for production and development
export const config = {
  // API Configuration
  api: {
    veo3: {
      baseUrl: 'https://api.kie.ai/api/v1/veo',
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 1000, // 1 second
    }
  },

  // Logging Configuration
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableConsole: true,
    enableExternalServices: process.env.NODE_ENV === 'production',
    
    // External logging services (configure these in your environment)
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
    },
    
    // Rate limiting for external services
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
    }
  },

  // Video Generation Configuration
  video: {
    defaultModel: 'veo3_fast' as const,
    defaultAspectRatio: '9:16' as const,
    maxPromptLength: 1000,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    
    // Polling configuration
    polling: {
      maxAttempts: 30,
      intervalMs: 10000, // 10 seconds
      timeoutMs: 300000, // 5 minutes
    }
  },

  // Security Configuration
  security: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    apiKeyHeader: 'Authorization',
  },

  // ImageKit Configuration
  imagekit: {
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    uploadFolder: '/video-generation/',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  // Feature Flags
  features: {
    enableFallback: process.env.ENABLE_FALLBACK === 'true',
    enableTranslation: process.env.ENABLE_TRANSLATION !== 'false',
    enableWatermarking: process.env.ENABLE_WATERMARKING === 'true',
    enableImageUpload: process.env.ENABLE_IMAGE_UPLOAD === 'true',
  },

  // Cashfree Configuration
  cashfree: {
    appId: process.env.CASHFREE_APP_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
    environment: process.env.CASHFREE_ENVIRONMENT || 'sandbox',
    apiVersion: '2025-01-01',
    baseUrl: process.env.CASHFREE_ENVIRONMENT === 'production' 
      ? 'https://api.cashfree.com' 
      : 'https://sandbox.cashfree.com'
  },

  // Environment Detection
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
} as const;

// Validation function
export function validateConfig() {
  const errors: string[] = [];

  if (!process.env.VEO3_API_KEY) {
    errors.push('VEO3_API_KEY environment variable is required');
  }

  if (config.video.maxPromptLength < 10) {
    errors.push('maxPromptLength must be at least 10 characters');
  }

  if (config.video.maxImageSize < 1024 * 1024) {
    errors.push('maxImageSize must be at least 1MB');
  }

  // ImageKit validation
  if (config.features.enableImageUpload) {
    if (!config.imagekit.urlEndpoint) {
      errors.push('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT environment variable is required for image upload');
    }
    if (!config.imagekit.publicKey) {
      errors.push('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY environment variable is required for image upload');
    }
    if (!config.imagekit.privateKey) {
      errors.push('IMAGEKIT_PRIVATE_KEY environment variable is required for image upload');
    }
  }

  // Cashfree validation
  if (!config.cashfree.appId) {
    errors.push('CASHFREE_APP_ID environment variable is required for payments');
  }
  if (!config.cashfree.secretKey) {
    errors.push('CASHFREE_SECRET_KEY environment variable is required for payments');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

// Get API key with validation
export function getApiKey(): string {
  const apiKey = process.env.VEO3_API_KEY;
  if (!apiKey) {
    throw new Error('VEO3_API_KEY environment variable is not set');
  }
  return apiKey;
}
