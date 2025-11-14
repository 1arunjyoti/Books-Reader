/**
 * Server-Side Input Sanitization Utilities
 * 
 * Provides defense-in-depth sanitization for user-generated content.
 * This is the FIRST line of defense before data reaches the database.
 * 
 * Security Principles:
 * 1. Never trust client input
 * 2. Sanitize at entry point (controller/service layer)
 * 3. Validate data types and lengths
 * 4. Remove potentially dangerous characters
 * 5. Log suspicious input attempts
 */

const logger = require('./logger');

/**
 * Sanitizes a single text string
 * @param {string|null|undefined} text - The text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  // Convert to string and trim
  let sanitized = String(text).trim();
  
  // Truncate to max length (prevent DoS)
  if (sanitized.length > maxLength) {
    logger.warn('Input truncated', { 
      originalLength: sanitized.length, 
      maxLength,
      preview: sanitized.substring(0, 50) + '...'
    });
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script-related patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Remove zero-width and invisible characters used in attacks
  sanitized = sanitized.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Log if suspicious patterns were found
  if (sanitized !== text.trim()) {
    logger.warn('Suspicious input detected and sanitized', {
      original: text.substring(0, 100),
      sanitized: sanitized.substring(0, 100)
    });
  }
  
  return sanitized;
}

/**
 * Sanitizes an array of strings
 * @param {Array<string>|null|undefined} arr - Array to sanitize
 * @param {number} maxItems - Maximum number of items
 * @param {number} maxItemLength - Maximum length per item
 * @returns {Array<string>} Sanitized array
 */
function sanitizeArray(arr, maxItems = 50, maxItemLength = 100) {
  if (!Array.isArray(arr)) return [];
  
  // Log if array is too large
  if (arr.length > maxItems) {
    logger.warn('Array truncated', { 
      originalLength: arr.length, 
      maxItems 
    });
  }
  
  return arr
    .slice(0, maxItems)
    .map(item => sanitizeText(item, maxItemLength))
    .filter(item => item.length > 0);
}

/**
 * Sanitizes a number
 * @param {number|string|null|undefined} num - Number to sanitize
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} Sanitized number or null if invalid
 */
function sanitizeNumber(num, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) {
  if (num === null || num === undefined) return null;
  
  const parsed = typeof num === 'number' ? num : parseFloat(String(num));
  
  if (isNaN(parsed) || !isFinite(parsed)) {
    logger.warn('Invalid number input', { input: num });
    return null;
  }
  
  // Clamp to range
  const clamped = Math.max(min, Math.min(max, parsed));
  
  if (clamped !== parsed) {
    logger.warn('Number clamped to range', { 
      original: parsed, 
      clamped, 
      min, 
      max 
    });
  }
  
  return clamped;
}

/**
 * Sanitizes and validates ISBN
 * @param {string|null|undefined} isbn - ISBN to validate
 * @returns {string|null} Sanitized ISBN or null
 */
function sanitizeISBN(isbn) {
  if (!isbn) return null;
  
  // Remove all non-alphanumeric characters (hyphens, spaces, etc.)
  let sanitized = String(isbn).replace(/[^0-9X]/gi, '').toUpperCase();
  
  // ISBN should be 10 or 13 digits
  if (sanitized.length !== 10 && sanitized.length !== 13) {
    logger.warn('Invalid ISBN length', { isbn, sanitized });
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitizes book metadata object
 * @param {Object} data - Book metadata to sanitize
 * @returns {Object} Sanitized book metadata
 */
function sanitizeBookMetadata(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  // Title (required, max 500 chars)
  if (data.title !== undefined) {
    sanitized.title = sanitizeText(data.title, 500);
    if (!sanitized.title) {
      logger.warn('Empty or invalid book title provided');
    }
  }
  
  // Author (max 200 chars)
  if (data.author !== undefined) {
    sanitized.author = sanitizeText(data.author, 200) || null;
  }
  
  // Description (max 5000 chars)
  if (data.description !== undefined) {
    sanitized.description = sanitizeText(data.description, 5000) || null;
  }
  
  // Genre (array, max 20 items, max 50 chars each)
  if (data.genre !== undefined) {
    sanitized.genre = sanitizeArray(data.genre, 20, 50);
  }
  
  // Publisher (max 200 chars)
  if (data.publisher !== undefined) {
    sanitized.publisher = sanitizeText(data.publisher, 200) || null;
  }
  
  // ISBN (10 or 13 digits)
  if (data.isbn !== undefined) {
    sanitized.isbn = sanitizeISBN(data.isbn);
  }
  
  // Language (max 50 chars, typically 2-5 char codes)
  if (data.language !== undefined) {
    sanitized.language = sanitizeText(data.language, 50) || null;
  }
  
  // Publication Year (1000-2100)
  if (data.publicationYear !== undefined) {
    sanitized.publicationYear = sanitizeNumber(data.publicationYear, 1000, 2100);
  }
  
  // Status (enum validation)
  if (data.status !== undefined) {
    const validStatuses = ['unread', 'reading', 'read', 'want-to-read'];
    const status = String(data.status).toLowerCase();
    sanitized.status = validStatuses.includes(status) ? status : undefined;
    
    if (data.status && !sanitized.status) {
      logger.warn('Invalid book status', { provided: data.status });
    }
  }
  
  // Progress (0-100)
  if (data.progress !== undefined) {
    sanitized.progress = sanitizeNumber(data.progress, 0, 100);
  }
  
  // Current Page (non-negative)
  if (data.currentPage !== undefined) {
    sanitized.currentPage = sanitizeNumber(data.currentPage, 0, 999999);
  }
  
  // Total Pages (non-negative)
  if (data.totalPages !== undefined) {
    sanitized.totalPages = sanitizeNumber(data.totalPages, 0, 999999);
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes search/filter parameters
 * @param {Object} filters - Filter parameters from request query
 * @returns {Object} Sanitized filters
 */
function sanitizeSearchFilters(filters) {
  if (!filters || typeof filters !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  // Search query (max 200 chars)
  if (filters.search) {
    sanitized.search = sanitizeText(filters.search, 200);
  }
  
  // Status filter
  if (filters.status) {
    const validStatuses = ['all', 'unread', 'reading', 'read', 'want-to-read'];
    const status = String(filters.status).toLowerCase();
    sanitized.status = validStatuses.includes(status) ? status : 'all';
  }
  
  // Genre filter (comma-separated string)
  if (filters.genre) {
    const genres = String(filters.genre).split(',').map(g => g.trim());
    sanitized.genre = sanitizeArray(genres, 20, 50).join(',');
  }
  
  // Format filter (comma-separated string)
  if (filters.format) {
    const validFormats = ['pdf', 'epub', 'txt'];
    const formats = String(filters.format).toLowerCase().split(',')
      .map(f => f.trim())
      .filter(f => validFormats.includes(f));
    
    if (formats.length > 0) {
      sanitized.format = formats.join(',');
    }
  }
  
  // Language filter
  if (filters.language) {
    sanitized.language = sanitizeText(filters.language, 50);
  }
  
  // Date filters (ISO date strings)
  if (filters.dateFrom) {
    const date = new Date(filters.dateFrom);
    if (!isNaN(date.getTime())) {
      sanitized.dateFrom = filters.dateFrom;
    }
  }
  
  if (filters.dateTo) {
    const date = new Date(filters.dateTo);
    if (!isNaN(date.getTime())) {
      sanitized.dateTo = filters.dateTo;
    }
  }
  
  // Sort parameters
  if (filters.sortBy) {
    const validSortFields = ['title', 'author', 'uploadedAt', 'updatedAt', 'publicationYear'];
    const sortBy = String(filters.sortBy);
    sanitized.sortBy = validSortFields.includes(sortBy) ? sortBy : 'uploadedAt';
  }
  
  if (filters.sortOrder) {
    const order = String(filters.sortOrder).toLowerCase();
    sanitized.sortOrder = (order === 'asc' || order === 'desc') ? order : 'desc';
  }
  
  return sanitized;
}

module.exports = {
  sanitizeText,
  sanitizeArray,
  sanitizeNumber,
  sanitizeISBN,
  sanitizeBookMetadata,
  sanitizeSearchFilters
};
