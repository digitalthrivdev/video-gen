// Production-level logging system for Veo 3 API
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  requestId?: string;
  userId?: string;
  duration?: number;
}

class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;
  private isDevelopment: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Set log level based on environment variable or default
    this.logLevel = this.getLogLevelFromEnv();
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLogLevel = process.env.LOG_LEVEL?.toUpperCase();
    
    switch (envLogLevel) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        // Default based on environment
        return this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const levelName = levelNames[entry.level];
    
    if (this.isProduction) {
      // Production: Structured JSON logging
      return JSON.stringify({
        timestamp: entry.timestamp,
        level: levelName,
        message: entry.message,
        context: entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack
        } : undefined,
        requestId: entry.requestId,
        userId: entry.userId,
        duration: entry.duration
      });
    } else {
      // Development: Human-readable format
      const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context, null, 2)}` : '';
      const errorStr = entry.error ? ` | Error: ${entry.error.message}` : '';
      const requestStr = entry.requestId ? ` | Request: ${entry.requestId}` : '';
      const durationStr = entry.duration ? ` | Duration: ${entry.duration}ms` : '';
      
      return `[${entry.timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}${requestStr}${durationStr}`;
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error, requestId?: string, userId?: string, duration?: number) {
    if (level > this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      requestId,
      userId,
      duration
    };

    const formattedLog = this.formatLogEntry(entry);

    // Console output
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }

    // In production, you might want to send logs to external services
    if (this.isProduction && level <= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // Example: Send critical errors to external logging service
    // You can integrate with services like:
    // - Sentry for error tracking
    // - LogRocket for session replay
    // - DataDog for monitoring
    // - CloudWatch for AWS
    // - Google Cloud Logging for GCP
    
    try {
      // Example implementation for Sentry
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(entry.error || new Error(entry.message), {
          extra: entry.context,
          tags: {
            requestId: entry.requestId,
            userId: entry.userId
          }
        });
      }
    } catch (error) {
      // Fallback: Don't let logging errors break the app
      console.error('Failed to send log to external service:', error);
    }
  }

  // Public logging methods
  error(message: string, error?: Error, context?: Record<string, any>, requestId?: string, userId?: string) {
    this.log(LogLevel.ERROR, message, context, error, requestId, userId);
  }

  warn(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    this.log(LogLevel.WARN, message, context, undefined, requestId, userId);
  }

  info(message: string, context?: Record<string, any>, requestId?: string, userId?: string, duration?: number) {
    this.log(LogLevel.INFO, message, context, undefined, requestId, userId, duration);
  }

  debug(message: string, context?: Record<string, any>, requestId?: string, userId?: string) {
    this.log(LogLevel.DEBUG, message, context, undefined, requestId, userId);
  }

  // Performance logging
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, { duration: Math.round(duration) });
    };
  }

  // API request logging
  logApiRequest(method: string, url: string, requestId: string, userId?: string) {
    this.info(`API Request: ${method} ${url}`, { method, url }, requestId, userId);
  }

  logApiResponse(method: string, url: string, status: number, duration: number, requestId: string, userId?: string) {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${url} - ${status}`, { method, url, status, duration }, undefined, requestId, userId, duration);
  }

  logApiError(method: string, url: string, error: Error, requestId: string, userId?: string) {
    this.error(`API Error: ${method} ${url}`, error, { method, url }, requestId, userId);
  }
}

// Create singleton instance
export const logger = new Logger();

// Utility functions for common logging patterns
export const logApiCall = async <T>(
  operation: string,
  apiCall: () => Promise<T>,
  requestId: string,
  userId?: string,
  context?: Record<string, any>
): Promise<T> => {
  const endTimer = logger.time(`${operation} API call`);
  
  try {
    logger.info(`Starting ${operation}`, { ...context }, requestId, userId);
    const result = await apiCall();
    endTimer();
    logger.info(`Completed ${operation}`, { ...context }, requestId, userId);
    return result;
  } catch (error) {
    endTimer();
    logger.error(`Failed ${operation}`, error as Error, { ...context }, requestId, userId);
    throw error;
  }
};

// Request ID generator
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
