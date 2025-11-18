/**
 * API client for BooksReader backend
 * Handles all communication with the Express server
 */

import { retryWithBackoff, API_RETRY_OPTIONS } from './retry-utils';
import { logger } from './logger';
import { API_ENDPOINTS } from './config';

const API_BASE_URL = API_ENDPOINTS.BASE;

export interface Book {
  id: string;
  title: string;
  author: string | null;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileId: string | null;
  fileSize: number;
  fileType?: string; // pdf, epub, txt
  userId: string;
  // coverKey is the stored key in object storage; coverUrl is a presigned URL (or null)
  coverKey?: string | null;
  coverUrl: string | null;
  status: string;
  progress: number;
  currentPage: number;
  totalPages: number;
  uploadedAt: string;
  updatedAt: string;
  lastReadAt: string | null;
  
  // Enhanced metadata fields
  description?: string | null;
  genre?: string[];
  publicationYear?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  pdfMetadata?: string | null;
}

export interface BooksResponse {
  books: Book[];
}

export interface BookResponse {
  book: Book;
}

export interface UpdateBookData {
  title?: string;
  author?: string | null;
  status?: string;
  progress?: number;
  currentPage?: number;
  totalPages?: number;
  description?: string | null;
  genre?: string[];
  publicationYear?: number | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
}

export interface Bookmark {
  id: string;
  bookId: string;
  userId: string;
  pageNumber: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
}

export interface BookmarkResponse {
  bookmark: Bookmark;
}

export interface CreateBookmarkData {
  bookId: string;
  pageNumber: number;
  note?: string;
}

export interface UpdateBookmarkData {
  note?: string;
}

export interface SearchFilters {
  search?: string;
  status?: string;
  genre?: string[];
  format?: string[];
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fetch all books for the authenticated user with optional filters
 */
export async function fetchBooks(accessToken: string, filters?: SearchFilters): Promise<Book[]> {
  return retryWithBackoff(async () => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.genre && filters.genre.length > 0) params.append('genre', filters.genre.join(','));
    if (filters.format && filters.format.length > 0) params.append('format', filters.format.join(','));
      if (filters.language) params.append('language', filters.language);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    const url = `${API_BASE_URL}/api/books${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch books' }));
      throw new Error(error.error || 'Failed to fetch books');
    }

    const data: BooksResponse = await response.json();
    return data.books;
  }, API_RETRY_OPTIONS);
}

/**
 * Fetch a single book by ID
 */
export async function fetchBook(id: string, accessToken: string): Promise<Book> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/books/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch book' }));
      throw new Error(error.error || 'Failed to fetch book');
    }

    const data: BookResponse = await response.json();
    return data.book;
  }, API_RETRY_OPTIONS);
}

/**
 * Update book metadata
 */
export async function updateBook(
  id: string,
  data: UpdateBookData,
  accessToken: string
): Promise<Book> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/books/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update book' }));
      throw new Error(error.error || 'Failed to update book');
    }

    const result: BookResponse = await response.json();
    return result.book;
  }, API_RETRY_OPTIONS);
}

/**
 * Delete a book
 */
export async function deleteBook(id: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/books/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete book' }));
    throw new Error(error.error || 'Failed to delete book');
  }
}

/**
 * Get presigned URL for a book file
 */
export async function getPresignedUrl(
  id: string,
  accessToken: string,
  expiresIn: number = 3600
): Promise<string> {
  return retryWithBackoff(async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/books/${id}/presigned-url?expiresIn=${expiresIn}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get presigned URL' }));
      throw new Error(error.error || 'Failed to get presigned URL');
    }

    const data = await response.json();
    return data.presignedUrl;
  }, API_RETRY_OPTIONS);
}

// ==================== BOOKMARK API FUNCTIONS ====================

/**
 * Create a new bookmark
 */
export async function createBookmark(
  data: CreateBookmarkData,
  accessToken: string
): Promise<Bookmark> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create bookmark' }));
      throw new Error(error.error || 'Failed to create bookmark');
    }

    const result: BookmarkResponse = await response.json();
    return result.bookmark;
  }, API_RETRY_OPTIONS);
}

/**
 * Fetch all bookmarks for a book
 */
export async function fetchBookmarks(
  bookId: string,
  accessToken: string
): Promise<Bookmark[]> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${bookId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch bookmarks' }));
      throw new Error(error.error || 'Failed to fetch bookmarks');
    }

    const data: BookmarksResponse = await response.json();
    return data.bookmarks;
  }, API_RETRY_OPTIONS);
}

/**
 * Update a bookmark
 */
export async function updateBookmark(
  id: string,
  data: UpdateBookmarkData,
  accessToken: string
): Promise<Bookmark> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update bookmark' }));
      throw new Error(error.error || 'Failed to update bookmark');
    }

    const result: BookmarkResponse = await response.json();
    return result.bookmark;
  }, API_RETRY_OPTIONS);
}

/**
 * Delete a bookmark
 */
export async function deleteBookmark(
  id: string,
  accessToken: string
): Promise<void> {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE_URL}/api/bookmarks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete bookmark' }));
      throw new Error(error.error || 'Failed to delete bookmark');
    }
  }, API_RETRY_OPTIONS);
}

// ==================== Analytics API ====================

export interface ReadingSession {
  id: string;
  bookId: string;
  userId: string;
  duration: number; // in seconds
  pagesRead: number;
  startPage: number;
  endPage: number;
  progressDelta: number;
  createdAt: string;
}

export interface CreateSessionData {
  bookId: string;
  duration: number;
  pagesRead?: number;
  startPage?: number;
  endPage?: number;
  progressDelta?: number;
}

export interface ReadingStats {
  totalReadingTime: number; // in seconds
  totalPagesRead: number;
  booksFinished: number;
  booksReading: number;
  currentStreak: number;
  readingSpeed: number; // pages per hour
  sessionsCount: number;
  chartData: Array<{
    date: string;
    minutes: number;
    pages: number;
  }>;
  period: string;
}

export interface ReadingGoal {
  id: string;
  userId: string;
  type: 'books' | 'pages' | 'time';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number;
  current: number;
  year: number | null;
  month: number | null;
  week: number | null;
  startDate: string;
  endDate: string;
}

export interface CreateGoalData {
  type: 'books' | 'pages' | 'time';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number;
}

export interface UpdateGoalData {
  current: number;
}

/**
 * Log a reading session
 */
export async function createReadingSession(
  data: CreateSessionData,
  accessToken: string
): Promise<ReadingSession> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/session`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to log reading session' }));
    console.error('[API] Reading session failed:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      hasToken: !!accessToken
    });
    throw new Error(errorData.error || 'Failed to log reading session');
  }

  return response.json();
}

/**
 * Get reading statistics
 */
export async function getReadingStats(
  period: 'all' | 'week' | 'month' | 'year' = 'all',
  accessToken: string
): Promise<ReadingStats> {
  const params = new URLSearchParams({ period });
  const response = await fetch(`${API_BASE_URL}/api/analytics/stats?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch reading stats' }));
    throw new Error(error.error || 'Failed to fetch reading stats');
  }

  return response.json();
}

/**
 * Get reading goals
 */
export async function getReadingGoals(
  accessToken: string
): Promise<ReadingGoal[]> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/goals`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch reading goals' }));
    throw new Error(error.error || 'Failed to fetch reading goals');
  }

  return response.json();
}

/**
 * Create or update a reading goal
 */
export async function createReadingGoal(
  data: CreateGoalData,
  accessToken: string
): Promise<ReadingGoal> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/goals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create reading goal' }));
    throw new Error(error.error || 'Failed to create reading goal');
  }

  return response.json();
}

/**
 * Update goal progress
 */
export async function updateReadingGoal(
  id: string,
  data: UpdateGoalData,
  accessToken: string
): Promise<ReadingGoal> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/goals/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update reading goal' }));
    throw new Error(error.error || 'Failed to update reading goal');
  }

  return response.json();
}

/**
 * Delete a reading goal
 */
export async function deleteReadingGoal(
  id: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/analytics/goals/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete reading goal' }));
    throw new Error(error.error || 'Failed to delete reading goal');
  }
}

// ==================== Collections API ====================

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  bookIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CollectionWithBooks {
  collection: Collection;
  books: Book[];
}

/**
 * Get all collections for the user
 */
export async function getCollections(
  accessToken: string
): Promise<Collection[]> {
  const response = await fetch(`${API_BASE_URL}/api/collections`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch collections' }));
    throw new Error(error.error || 'Failed to fetch collections');
  }

  return response.json();
}

/**
 * Create a new collection
 */
export async function createCollection(
  data: CreateCollectionData,
  accessToken: string
): Promise<Collection> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create collection' }));
      throw new Error(error.error || 'Failed to create collection');
    }

    return response.json();
  } catch (error) {
    // If network error (server unavailable)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Collections require a server connection. Please ensure the backend server is running.');
    }
    throw error;
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  data: UpdateCollectionData,
  accessToken: string
): Promise<Collection> {
  const response = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update collection' }));
    throw new Error(error.error || 'Failed to update collection');
  }

  return response.json();
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  id: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/collections/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete collection' }));
    throw new Error(error.error || 'Failed to delete collection');
  }
}

/**
 * Add books to a collection
 */
export async function addBooksToCollection(
  collectionId: string,
  bookIds: string[],
  accessToken: string
): Promise<Collection> {
  const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/books`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to add books to collection' }));
    throw new Error(error.error || 'Failed to add books to collection');
  }

  return response.json();
}

/**
 * Remove books from a collection
 */
export async function removeBooksFromCollection(
  collectionId: string,
  bookIds: string[],
  accessToken: string
): Promise<Collection> {
  const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/books`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bookIds }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to remove books from collection' }));
    throw new Error(error.error || 'Failed to remove books from collection');
  }

  return response.json();
}

/**
 * Get books in a collection
 */
export async function getCollectionBooks(
  collectionId: string,
  accessToken: string
): Promise<CollectionWithBooks> {
  const response = await fetch(`${API_BASE_URL}/api/collections/${collectionId}/books`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch collection books' }));
    throw new Error(error.error || 'Failed to fetch collection books');
  }

  return response.json();
}

// ===== Upload from URL =====

/**
 * Upload a PDF file from a URL
 */
export async function uploadFromUrl(url: string, accessToken: string): Promise<Book> {
  const response = await fetch(`${API_BASE_URL}/api/upload-from-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload from URL' }));
    throw new Error(error.error || 'Failed to upload from URL');
  }

  const data = await response.json();
  return data.book;
}

// ===== Welcome Screen =====

/**
 * Get welcome screen status
 * Falls back to false (not shown) if server is unavailable
 */
export async function getWelcomeStatus(accessToken: string): Promise<boolean> {
  try {
    logger.log('[API] Calling GET /api/user/welcome-status');
    const response = await fetch(`${API_BASE_URL}/api/user/welcome-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    logger.log('[API] Welcome status response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get welcome status' }));
      logger.warn('[API] Welcome status unavailable, defaulting to not shown:', error);
      return false; // Default to showing welcome screen if server unavailable
    }

    const data = await response.json();
    logger.log('[API] Welcome status data:', data);
    return data.welcomeShown;
  } catch (error) {
    logger.warn('[API] Welcome status check failed (server unavailable), defaulting to not shown');
    return false; // Default to showing welcome screen if server unavailable
  }
}

/**
 * Mark welcome screen as shown
 * Silently fails if server is unavailable
 */
export async function markWelcomeShown(accessToken: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/welcome-shown`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to mark welcome as shown' }));
      logger.warn('[API] Could not mark welcome as shown (server unavailable):', error);
    }
  } catch (error) {
    logger.warn('[API] Could not mark welcome as shown (server unavailable)');
  }
}
