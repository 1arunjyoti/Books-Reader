/**
 * Safe localStorage utility with quota management
 * Handles QuotaExceededError by cleaning up old PDF settings
 */

import { logger } from './logger';

const SCALE_STORAGE_PREFIX = 'pdfReaderScale:';
const ROTATION_STORAGE_PREFIX = 'pdfReaderRotation:';
const MAX_STORED_PDF_SETTINGS = 20; // Keep settings for 20 most recent PDFs

interface SafeLocalStorageResult {
  success: boolean;
  error?: string;
}

/**
 * Safely write to localStorage with automatic quota management
 */
export function safeLocalStorageSetItem(
  key: string,
  value: string
): SafeLocalStorageResult {
  try {
    window.localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.warn('LocalStorage quota exceeded. Cleaning old PDF settings...');

      // Try to clean up old PDF settings
      const cleaned = cleanupOldPdfSettings();

      if (cleaned > 0) {
        // Retry after cleanup
        try {
          window.localStorage.setItem(key, value);
          logger.log(`Successfully saved after cleaning ${cleaned} old settings`);
          return { success: true };
        } catch (retryError) {
          logger.error('Still failed after cleanup:', retryError);
          return {
            success: false,
            error: 'Storage full even after cleanup',
          };
        }
      }

      return {
        success: false,
        error: 'Storage quota exceeded',
      };
    }

    // Handle other errors
    logger.error('LocalStorage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Safely read from localStorage
 */
export function safeLocalStorageGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    logger.error('LocalStorage read error:', error);
    return null;
  }
}

/**
 * Clean up old PDF settings to free up space
 * Keeps only the most recent MAX_STORED_PDF_SETTINGS
 */
function cleanupOldPdfSettings(): number {
  try {
    // Get all PDF-related keys with timestamps
    const pdfKeys: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      // Check if it's a PDF setting
      if (
        key.startsWith(SCALE_STORAGE_PREFIX) ||
        key.startsWith(ROTATION_STORAGE_PREFIX)
      ) {
        // Use the key itself as a pseudo-timestamp (lexicographic order)
        // In a real app, you might store actual timestamps
        pdfKeys.push({
          key,
          timestamp: 0, // We'll sort alphabetically since we don't have timestamps
        });
      }
    }

    // If we have more than MAX_STORED_PDF_SETTINGS, remove the oldest
    if (pdfKeys.length > MAX_STORED_PDF_SETTINGS) {
      // Sort alphabetically (oldest book IDs typically come first)
      pdfKeys.sort((a, b) => a.key.localeCompare(b.key));

      // Calculate how many to remove (remove half to make room)
      const countToRemove = Math.ceil(pdfKeys.length / 2);
      const keysToRemove = pdfKeys.slice(0, countToRemove);

      // Remove old settings
      keysToRemove.forEach(({ key }) => {
        window.localStorage.removeItem(key);
      });

      logger.log(`Cleaned up ${keysToRemove.length} old PDF settings`);
      return keysToRemove.length;
    }

    return 0;
  } catch (error) {
    logger.error('Error during cleanup:', error);
    return 0;
  }
}

/**
 * Get current localStorage usage information
 */
export function getLocalStorageInfo(): {
  used: number;
  available: number;
  percentage: number;
} {
  try {
    // Estimate current usage
    let used = 0;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key) {
        const value = window.localStorage.getItem(key);
        // Each character is roughly 2 bytes in UTF-16
        used += (key.length + (value?.length || 0)) * 2;
      }
    }

    // Most browsers have 5-10MB limit, we'll assume 5MB
    const available = 5 * 1024 * 1024; // 5MB in bytes
    const percentage = (used / available) * 100;

    return {
      used,
      available,
      percentage: Math.min(percentage, 100),
    };
  } catch (error) {
    logger.error('Error getting localStorage info:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Remove all PDF settings from localStorage
 */
export function clearAllPdfSettings(): number {
  try {
    let count = 0;
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;

      if (
        key.startsWith(SCALE_STORAGE_PREFIX) ||
        key.startsWith(ROTATION_STORAGE_PREFIX)
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
      count++;
    });

    if (count > 0) {
      logger.log(`Cleared ${count} PDF settings`);
    }

    return count;
  } catch (error) {
    logger.error('Error clearing PDF settings:', error);
    return 0;
  }
}
