/**
 * Centralized configuration for API endpoints
 * Single source of truth for all API URLs
 * 
 * Environment variables:
 * - NEXT_PUBLIC_API_URL: Backend API base URL (required in production)
 * 
 * Development fallback: http://localhost:5000
 * Production: Must set NEXT_PUBLIC_API_URL
 * Docker: Set NEXT_PUBLIC_API_URL=http://server:5000 or similar
 */

/**
 * Get the API base URL from environment or use development default
 * @returns {string} API base URL without trailing slash
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or localhost
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  }
  
  // Client-side: use environment variable or localhost
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
}

/**
 * API endpoint URLs
 * These are derived from the base URL, so changing NEXT_PUBLIC_API_URL updates all endpoints
 */
export const API_ENDPOINTS = {
  // Base
  BASE: getApiBaseUrl(),
  
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
