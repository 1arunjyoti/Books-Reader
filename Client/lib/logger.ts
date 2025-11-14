/**
 * @file Client/lib/logger.ts
 * @description Environment-aware logger utility
 * 
 * Automatically adapts logging based on environment:
 * - Development: Shows all logs (debug, info, warn, error)
 * - Production: Shows only errors
 * 
 * @usage
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.log('Debug message');      // Hidden in production
 * logger.error('Error message');    // Always shown
 * ```
 */

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isClient = typeof window !== 'undefined';

/**
 * Sanitize sensitive data before logging
 * Removes tokens, secrets, passwords, etc.
 * Handles circular references and complex objects safely
 */
function sanitizeForLogging(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  // Handle Error objects specially
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };
  }

  if (typeof data === 'object' && !Array.isArray(data)) {
    try {
      // Use JSON stringify/parse to handle circular references
      const jsonString = JSON.stringify(data);
      const obj = JSON.parse(jsonString);
      
      // List of sensitive field names to remove
      const sensitiveFields = [
        'token',
        'accessToken',
        'refreshToken',
        'password',
        'secret',
        'apiKey',
        'clientSecret',
        'auth0Secret',
        'authorization',
        'authorization_header'
      ];

      sensitiveFields.forEach((field) => {
        delete obj[field];
      });

      return obj;
    } catch {
      // If object can't be serialized, return a safe string
      return '[Unable to serialize object - may contain circular references]';
    }
  }

  return data;
}

/**
 * Production-safe logger
 * 
 * Available methods:
 * - log(): Debug/info logging (dev only)
 * - warn(): Warning logging (dev only)
 * - error(): Error logging (always shown)
 * - time/timeEnd: Performance timing (dev only)
 * - group/groupCollapsed/groupEnd: Log grouping (dev only)
 * - table: Table display (dev only)
 */
export const logger = {
  /**
   * Development-only log
   * Shows in development, hidden in production
   *
   * @param message - Log message
   * @param data - Optional data to log
   *
   * @example
   * logger.log('Applying highlights:', highlights);
   */
  log: (message: string, data?: unknown) => {
    if (!isDev || !isClient) return;
    if (data !== undefined) {
      console.log(`[📝] ${message}`, sanitizeForLogging(data));
    } else {
      console.log(`[📝] ${message}`);
    }
  },

  /**
   * Development-only warning
   * Shows in development, hidden in production
   *
   * @param message - Warning message
   * @param data - Optional data
   *
   * @example
   * logger.warn('Unusual condition:', condition);
   */
  warn: (message: string, data?: unknown) => {
    if (!isDev || !isClient) return;
    if (data !== undefined) {
      console.warn(`[⚠️] ${message}`, sanitizeForLogging(data));
    } else {
      console.warn(`[⚠️] ${message}`);
    }
  },

  /**
   * Error log (ALWAYS shown)
   * Visible in both development and production
   * Safe for production use
   *
   * @param message - Error message
   * @param error - Error object or data
   *
   * @example
   * logger.error('Failed to apply highlight:', error);
   */
  error: (message: string, error?: unknown) => {
    if (!isClient) return;

    try {
      if (error instanceof Error) {
        // Ensure we have meaningful error information to display
        const errorInfo: Record<string, unknown> = {};
        
        if (error.message) {
          errorInfo.message = error.message;
        }
        if (error.stack) {
          errorInfo.stack = error.stack;
        }
        
        // If error has no message or stack, include the error name
        if (!error.message && !error.stack) {
          errorInfo.name = error.name || 'Error';
          errorInfo.errorString = String(error);
        }
        
        // If we have any info, log it; otherwise just log the message
        if (Object.keys(errorInfo).length > 0) {
          console.error(`[❌] ${message}`, errorInfo);
        } else {
          console.error(`[❌] ${message}`);
        }
      } else if (error !== undefined) {
        console.error(`[❌] ${message}`, sanitizeForLogging(error));
      } else {
        console.error(`[❌] ${message}`);
      }
    } catch {
      // Last resort: if sanitizeForLogging fails, log a simple string
      console.error(`[❌] ${message}`, '[Unable to serialize error object]');
    }
  },

  /**
   * Development-only info log
   * For important informational messages
   *
   * @param message - Info message
   * @param data - Optional data
   *
   * @example
   * logger.info('Book loaded successfully');
   */
  info: (message: string, data?: unknown) => {
    if (!isDev || !isClient) return;
    if (data !== undefined) {
      console.info(`[ℹ️] ${message}`, sanitizeForLogging(data));
    } else {
      console.info(`[ℹ️] ${message}`);
    }
  },

  /**
   * Development-only debug log
   * For detailed debugging information
   *
   * @param message - Debug message
   * @param data - Optional data
   *
   * @example
   * logger.debug('Detailed state:', complexObject);
   */
  debug: (message: string, data?: unknown) => {
    if (!isDev || !isClient) return;
    if (data !== undefined) {
      console.debug(`[🐛] ${message}`, sanitizeForLogging(data));
    } else {
      console.debug(`[🐛] ${message}`);
    }
  },

  /**
   * Start performance timing (dev only)
   * Use with timeEnd() to measure duration
   *
   * @param label - Timer label
   *
   * @example
   * logger.time('highlight-application');
   * applyHighlights(highlights);
   * logger.timeEnd('highlight-application');
   */
  time: (label: string) => {
    if (!isDev || !isClient) return;
    console.time(`⏱️ ${label}`);
  },

  /**
   * End performance timing (dev only)
   * Shows elapsed time since time() was called
   *
   * @param label - Timer label (must match time() call)
   *
   * @example
   * logger.timeEnd('highlight-application');
   */
  timeEnd: (label: string) => {
    if (!isDev || !isClient) return;
    console.timeEnd(`⏱️ ${label}`);
  },

  /**
   * Start log group (dev only)
   * Groups related logs together with arrow disclosure
   *
   * @param label - Group label
   *
   * @example
   * logger.group('Navigation');
   * logger.log('Page:', page);
   * logger.log('Position:', position);
   * logger.groupEnd();
   */
  group: (label: string) => {
    if (!isDev || !isClient) return;
    console.group(`📂 ${label}`);
  },

  /**
   * Start collapsed log group (dev only)
   * Same as group() but collapsed by default
   *
   * @param label - Group label
   *
   * @example
   * logger.groupCollapsed('Highlight Details');
   */
  groupCollapsed: (label: string) => {
    if (!isDev || !isClient) return;
    console.groupCollapsed(`📂 ${label}`);
  },

  /**
   * End log group (dev only)
   *
   * @example
   * logger.groupEnd();
   */
  groupEnd: () => {
    if (!isDev || !isClient) return;
    console.groupEnd();
  },

  /**
   * Display data as table (dev only)
   * Useful for arrays of objects
   *
   * @param data - Array or object to display
   *
   * @example
   * logger.table(highlights);  // Shows as table
   */
  table: (data: unknown) => {
    if (!isDev || !isClient) return;
    console.table(data);
  }
};

export default logger;
