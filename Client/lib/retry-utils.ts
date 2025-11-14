/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides robust retry logic for API calls with:
 * - Exponential backoff (1s, 2s, 4s, 8s)
 * - Smart error detection (don't retry auth errors)
 * - Configurable retry attempts
 * - Error logging
 */

import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  shouldRetry: (error: unknown) => {
    // Don't retry authentication errors (401, 403)
    if (error instanceof Response) {
      return error.status !== 401 && error.status !== 403;
    }
    
    // Don't retry on fetch errors that indicate client-side issues
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return true; // Network errors should be retried
    }
    
    return true; // Retry other errors
  },
  onRetry: () => {}, // No-op by default
};

/**
 * Execute a function with retry logic and exponential backoff
 * 
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result
 * @throws The last error if all retries fail
 * 
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetch('/api/data').then(r => r.json()),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt === opts.maxRetries - 1) {
        break;
      }
      
      // Calculate delay with exponential backoff
      const exponentialDelay = opts.initialDelayMs * Math.pow(2, attempt);
      const delay = Math.min(exponentialDelay, opts.maxDelayMs);
      
      // Add jitter (±10%) to prevent thundering herd
      const jitter = delay * (0.9 + Math.random() * 0.2);
      
      // Notify about retry
      opts.onRetry(attempt + 1, error);
      
      logger.warn(
        `Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(jitter)}ms`,
        error instanceof Error ? error.message : String(error)
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitter));
    }
  }
  
  // All retries failed
  throw lastError;
}

/**
 * Create a retryable version of an async function
 * 
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns A new function with retry logic built-in
 * 
 * @example
 * ```typescript
 * const fetchWithRetry = makeRetryable(
 *   (url: string) => fetch(url).then(r => r.json()),
 *   { maxRetries: 3 }
 * );
 * 
 * const data = await fetchWithRetry('/api/data');
 * ```
 */
export function makeRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => retryWithBackoff(() => fn(...args), options);
}

/**
 * Retry options specifically for API calls
 */
export const API_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  shouldRetry: (error: unknown) => {
    // Don't retry client errors (4xx except 408, 429)
    if (error instanceof Response) {
      const status = error.status;
      
      // Don't retry authentication/authorization errors
      if (status === 401 || status === 403) {
        return false;
      }
      
      // Don't retry bad request, not found, conflict, etc.
      if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
        return false;
      }
      
      // Retry server errors (5xx) and rate limits (429)
      return true;
    }
    
    // Retry network errors
    return true;
  },
  onRetry: (attempt, error) => {
    logger.log(`API retry attempt ${attempt}:`, error);
  },
};

/**
 * Retry options for less critical operations
 */
export const LENIENT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  initialDelayMs: 500,
  maxDelayMs: 2000,
};

/**
 * Retry options for critical operations
 */
export const CRITICAL_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 15000,
};
