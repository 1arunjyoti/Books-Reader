/**
 * EPUB Cache Utilities
 * 
 * Provides caching mechanisms for EPUB-related data to improve performance:
 * - Presigned URL caching (sessionStorage)
 * - Location data caching (future: IndexedDB)
 * - Metadata caching (future: IndexedDB)
 */

import { logger } from './logger';

// Debug logging - only in development mode
const DEBUG = process.env.NODE_ENV === 'development';
const log = (...args: unknown[]) => DEBUG && logger.log(String(args[0]), args[1]);
const warn = (...args: unknown[]) => DEBUG && logger.warn(String(args[0]), args[1]);

interface CachedPresignedUrl {
  url: string;
  expires: number;
  bookId: string;
}

/**
 * Get cached presigned URL or fetch new one
 * 
 * @param bookId - Unique book identifier
 * @param fetchUrl - Function to fetch new URL if cache miss
 * @param ttl - Time to live in seconds (default: 7 days)
 * @returns Presigned URL
 * 
 * @example
 * const url = await getCachedPresignedUrl(
 *   bookId,
 *   () => getPresignedUrl(bookId, token, 604800),
 *   604800 // 7 days
 * );
 */
export const getCachedPresignedUrl = async (
  bookId: string,
  fetchUrl: () => Promise<string>,
  ttl: number = 604800 // 7 days default (matches S3 max)
): Promise<string> => {
  const cacheKey = `epub-presigned-url-${bookId}`;
  
  // Check sessionStorage cache
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const data: CachedPresignedUrl = JSON.parse(cached);
        
        // Validate cache entry
        if (data.bookId === bookId && data.url && data.expires) {
          // Return cached URL if still valid (with 1-hour buffer for safety)
          const bufferTime = 3600 * 1000; // 1 hour in milliseconds
          const now = Date.now();
          
          if (now < data.expires - bufferTime) {
            log(`✅ Using cached presigned URL for book ${bookId} (valid for ${Math.round((data.expires - now) / 1000 / 60)} more minutes)`);
            return data.url;
          } else {
            log(`⏰ Cached URL expired for book ${bookId}, fetching new one`);
          }
        }
      }
    } catch (error) {
      // Invalid cache data, continue to fetch
      warn('Failed to parse cached URL, fetching new one:', error);
    }
  }
  
  // Fetch new URL
  log(`🔄 Fetching new presigned URL for book ${bookId}`);
  const url = await fetchUrl();
  
  // Cache for session
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const cacheData: CachedPresignedUrl = {
        url,
        expires: Date.now() + (ttl * 1000),
        bookId,
      };
      
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      log(`💾 Cached presigned URL for book ${bookId} (valid for ${ttl / 3600} hours)`);
    } catch (error) {
      // sessionStorage full or disabled, not critical
      warn('Failed to cache presigned URL (storage full or disabled):', error);
    }
  }
  
  return url;
};

/**
 * Clear cached presigned URL for a specific book
 * Useful when URL needs to be refreshed manually
 * 
 * @param bookId - Book identifier
 */
export const clearCachedPresignedUrl = (bookId: string): void => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const cacheKey = `epub-presigned-url-${bookId}`;
    sessionStorage.removeItem(cacheKey);
    log(`🗑️ Cleared cached presigned URL for book ${bookId}`);
  }
};

/**
 * Clear all cached presigned URLs
 * Useful for debugging or after sign out
 */
export const clearAllCachedUrls = (): void => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const keys = Object.keys(sessionStorage);
    let count = 0;
    
    keys.forEach(key => {
      if (key.startsWith('epub-presigned-url-')) {
        sessionStorage.removeItem(key);
        count++;
      }
    });
    
    log(`🗑️ Cleared ${count} cached presigned URLs`);
  }
};

/**
 * Get cache statistics
 * Useful for debugging and monitoring
 */
export const getCacheStats = (): { count: number; totalSize: number; entries: Array<{ bookId: string; expiresIn: number }> } => {
  const stats = {
    count: 0,
    totalSize: 0,
    entries: [] as Array<{ bookId: string; expiresIn: number }>,
  };
  
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const keys = Object.keys(sessionStorage);
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith('epub-presigned-url-')) {
        try {
          const cached = sessionStorage.getItem(key);
          if (cached) {
            const data: CachedPresignedUrl = JSON.parse(cached);
            const expiresIn = Math.max(0, Math.round((data.expires - now) / 1000 / 60)); // minutes
            
            stats.count++;
            stats.totalSize += cached.length;
            stats.entries.push({
              bookId: data.bookId,
              expiresIn,
            });
          }
        } catch {
          // Invalid entry, skip
        }
      }
    });
  }
  
  return stats;
};
