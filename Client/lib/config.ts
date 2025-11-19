/**
 * Centralized configuration for API endpoints
 * Single source of truth for all API URLs
 * 
 * Environment variables:
 * - NEXT_PUBLIC_API_URL: Backend API base URL (REQUIRED)
 * 
 * Development: Defaults to http://localhost:3001
 * Production: MUST set NEXT_PUBLIC_API_URL - will throw error if missing
 * Docker: Set NEXT_PUBLIC_API_URL=http://server:3001 or your backend URL
 */

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get the API base URL from environment or use development default
 * In production, throws an error if NEXT_PUBLIC_API_URL is not set
 * @returns {string} API base URL without trailing slash
 * @throws {Error} If in production and NEXT_PUBLIC_API_URL is not set
 */
export function getApiBaseUrl(): string {
  const envValue = process.env.NEXT_PUBLIC_API_URL;
  
  // Production: Require explicit configuration
  if (isProduction && !envValue) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required in production. ' +
      'Please set this environment variable to your backend API URL.'
    );
  }
  
  // Development: Use localhost default
  const defaultValue = 'http://localhost:3001';
  let result = (envValue || defaultValue).replace(/\/$/, '');
  
  // Validate URL format
  if (!result || result === 'http:/' || result === 'https:/') {
    const error = `Invalid API base URL: "${result}". Expected format: http://domain:port or https://domain`;
    if (isProduction) {
      throw new Error(error);
    }
    console.error('[Config]', error, 'Using default:', defaultValue);
    result = defaultValue;
  }
  
  // Production: Enforce HTTPS
  if (isProduction && !result.startsWith('https://') && !result.includes('localhost')) {
    console.warn(
      '[Config] WARNING: Using HTTP in production is insecure. ' +
      'NEXT_PUBLIC_API_URL should use HTTPS:',
      result
    );
  }
  
  return result;
}

/**
 * API endpoint URLs
 * These are derived from the base URL, so changing NEXT_PUBLIC_API_URL updates all endpoints
 * 
 * Note: BASE uses a getter to ensure it's always fresh, not cached at module load time
 */
export const API_ENDPOINTS = {
  // Base - use getter to avoid caching issues
  get BASE() {
    return getApiBaseUrl();
  },
  
  // Books
  BOOKS: `${getApiBaseUrl()}/api/books`,
  BOOK_DETAIL: (bookId: string) => `${getApiBaseUrl()}/api/books/${bookId}`,
  BOOK_DELETE: (bookId: string) => `${getApiBaseUrl()}/api/books/${bookId}`,
  BOOK_UPDATE: (bookId: string) => `${getApiBaseUrl()}/api/books/${bookId}`,
  BOOK_DOWNLOAD: (bookId: string) => `${getApiBaseUrl()}/api/books/${bookId}/download`,
  
  // Bookmarks
  BOOKMARKS: `${getApiBaseUrl()}/api/bookmarks`,
  BOOKMARK_DELETE: (bookmarkId: string) => `${getApiBaseUrl()}/api/bookmarks/${bookmarkId}`,
  
  // Highlights
  HIGHLIGHTS_BASE: `${getApiBaseUrl()}/api/highlights`,
  HIGHLIGHTS_BY_BOOK: (bookId: string) => `${getApiBaseUrl()}/api/highlights/${bookId}`,
  HIGHLIGHT_DETAIL: (highlightId: string) => `${getApiBaseUrl()}/api/highlights/${highlightId}`,
  HIGHLIGHT_DELETE: (highlightId: string) => `${getApiBaseUrl()}/api/highlights/${highlightId}`,
  HIGHLIGHT_UPDATE: (highlightId: string) => `${getApiBaseUrl()}/api/highlights/${highlightId}`,
  
  // Upload
  UPLOAD: `${getApiBaseUrl()}/api/upload`,
  UPLOAD_FROM_URL: `${getApiBaseUrl()}/api/upload-from-url`,
  
  // User & Profile
  USER_PROFILE: `${getApiBaseUrl()}/api/user/profile`,
  USER_DELETE: `${getApiBaseUrl()}/api/user/delete`,
  USER_UPDATE_NAME: `${getApiBaseUrl()}/api/user/update-name`,
  
  // Analytics
  ANALYTICS_SESSION: `${getApiBaseUrl()}/api/analytics/session`,
  ANALYTICS_STATS: `${getApiBaseUrl()}/api/analytics/stats`,
  ANALYTICS_GOALS: `${getApiBaseUrl()}/api/analytics/goals`,
  
  // Collections
  COLLECTIONS: `${getApiBaseUrl()}/api/collections`,
  COLLECTION_DETAIL: (collectionId: string) => `${getApiBaseUrl()}/api/collections/${collectionId}`,
  
  // Health
  HEALTH: `${getApiBaseUrl()}/health`,
} as const;

export default API_ENDPOINTS;
