import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base logger configuration
const baseConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Development configuration with pretty print
const developmentConfig = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
      messageFormat: (log: { level: string; msg: string }) => {
        // Add emojis for better readability in dev
        if (log.level === 'error') return `❌ ${log.msg}`;
        if (log.level === 'warn') return `⚠️ ${log.msg}`;
        if (log.level === 'info') return `ℹ️ ${log.msg}`;
        return log.msg;
      },
    },
  },
};

// Production configuration (JSON output)
const productionConfig = {
  ...baseConfig,
  level: 'info',
};

// Create logger instance
export const logger = pino(
  isDevelopment ? developmentConfig : productionConfig
);

// Helper functions for common logging scenarios
export const loggers = {
  // API request logging
  apiRequest: (method: string, path: string, statusCode: number, duration: number) => {
    logger.info(
      {
        type: 'api_request',
        method,
        path,
        statusCode,
        duration,
      },
      `${method} ${path} - ${statusCode} (${duration}ms)`
    );
  },

  // API error logging
  apiError: (method: string, path: string, error: unknown, statusCode?: number) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error(
      {
        type: 'api_error',
        method,
        path,
        statusCode,
        error: errorMessage,
        stack: errorStack,
      },
      `${method} ${path} - Error: ${errorMessage}`
    );
  },

  // Database operation logging
  dbQuery: (operation: string, model: string, duration?: number) => {
    logger.debug(
      {
        type: 'db_query',
        operation,
        model,
        duration,
      },
      `DB: ${operation} on ${model}${duration ? ` (${duration}ms)` : ''}`
    );
  },

  // Authentication logging
  authEvent: (event: string, userId?: string, metadata?: Record<string, unknown>) => {
    logger.info(
      {
        type: 'auth_event',
        event,
        userId,
        ...metadata,
      },
      `Auth: ${event}${userId ? ` - ${userId}` : ''}`
    );
  },

  // Performance logging
  performance: (operation: string, duration: number, metadata?: Record<string, unknown>) => {
    logger.warn(
      {
        type: 'performance',
        operation,
        duration,
        ...metadata,
      },
      `Performance: ${operation} took ${duration}ms`
    );
  },

  // Realtime subscription logging
  realtime: (event: string, userId: string, metadata?: Record<string, unknown>) => {
    logger.info(
      {
        type: 'realtime',
        event,
        userId,
        ...metadata,
      },
      `Realtime: ${event} - ${userId}`
    );
  },
};

// Export default logger as named export for consistency
export { logger as default };
