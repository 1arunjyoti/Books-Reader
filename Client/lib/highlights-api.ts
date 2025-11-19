/**
 * Highlight API Client
 * Wrapper around the highlights API endpoints
 */

import type { Highlight, HighlightSource, PdfHighlightRect } from '@/types/highlights';
import { retryWithBackoff, API_RETRY_OPTIONS } from './retry-utils';
import { API_ENDPOINTS } from './config';

const API_BASE = API_ENDPOINTS.HIGHLIGHTS_BASE;

export interface HighlightPayload {
  text: string;
  color: string;
  hex: string;
  note?: string;
  cfiRange?: string;
  pageNumber?: number;
  rects?: PdfHighlightRect[];
  boundingRect?: PdfHighlightRect;
  source?: HighlightSource;
}

/**
 * Create a new highlight
 */
export const createHighlight = async (
  bookId: string,
  highlight: HighlightPayload,
  accessToken: string
) => {
  return retryWithBackoff(async () => {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        bookId,
        ...highlight,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create highlight' }));
      throw new Error(error.error || 'Failed to create highlight');
    }

    const data = await response.json();
    if (!data) {
      throw new Error('No data returned from highlight creation');
    }
    return data;
  }, API_RETRY_OPTIONS);
};

/**
 * Get all highlights for a book
 */
export const fetchHighlights = async (bookId: string, accessToken: string): Promise<Highlight[]> => {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE}/book/${bookId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch highlights');
    }

    const data = await response.json();
    return data || [];
  }, API_RETRY_OPTIONS);
};

/**
 * Get a single highlight by ID
 */
export const getHighlight = async (highlightId: string, accessToken: string) => {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE}/${highlightId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch highlight');
    }

    const data = await response.json();
    if (!data) {
      throw new Error('No data returned from highlight fetch');
    }
    return data;
  }, API_RETRY_OPTIONS);
};

/**
 * Update a highlight (change color or add note)
 */
export const updateHighlight = async (
  highlightId: string,
  updates: Partial<HighlightPayload>,
  accessToken: string
) => {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE}/${highlightId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update highlight' }));
      throw new Error(error.error || 'Failed to update highlight');
    }

    const data = await response.json();
    if (!data) {
      throw new Error('No data returned from highlight update');
    }
    return data;
  }, API_RETRY_OPTIONS);
};

/**
 * Delete a highlight
 */
export const deleteHighlight = async (highlightId: string, accessToken: string) => {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE}/${highlightId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete highlight' }));
      throw new Error(error.error || 'Failed to delete highlight');
    }

    const data = await response.json();
    return data || { success: true };
  }, API_RETRY_OPTIONS);
};

/**
 * Get highlight statistics for a book
 */
export const getHighlightStats = async (bookId: string, accessToken: string) => {
  return retryWithBackoff(async () => {
    const response = await fetch(`${API_BASE}/book/${bookId}/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch highlight stats');
    }

    const data = await response.json();
    return data || { count: 0, colors: {} };
  }, API_RETRY_OPTIONS);
};

/**
 * Search highlights by text
 */
export const searchHighlights = async (
  bookId: string,
  query: string,
  accessToken: string
) => {
  const response = await fetch(
    `${API_BASE}/book/${bookId}/search?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to search highlights');
  }

  const data = await response.json();
  return data || [];
};

/**
 * Filter highlights by color
 */
export const filterHighlightsByColor = async (
  bookId: string,
  colors: string[],
  accessToken: string
) => {
  const colorQuery = colors.join(',');
  const response = await fetch(
    `${API_BASE}/book/${bookId}/filter?colors=${encodeURIComponent(colorQuery)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to filter highlights');
  }

  const data = await response.json();
  return data || [];
};

/**
 * Delete all highlights for a book
 */
export const deleteBookHighlights = async (bookId: string, accessToken: string) => {
  const response = await fetch(`${API_BASE}/book/${bookId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete book highlights');
  }

  const data = await response.json();
  return data || { success: true };
};
