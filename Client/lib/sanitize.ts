/**
 * Text Sanitization Utilities
 * 
 * Provides defense-in-depth sanitization for user-generated content.
 * While React auto-escapes JSX, this provides additional protection against:
 * - XSS attacks if data is ever used in dangerouslySetInnerHTML
 * - Script injection in attributes
 * - Malformed Unicode/encoding attacks
 * 
 * Usage:
 * import { sanitizeText, sanitizeArray } from '@/lib/sanitize';
 * 
 * <h3>{sanitizeText(book.title)}</h3>
 * {sanitizeArray(book.genre).map(g => <span>{g}</span>)}
 */

/**
 * Sanitizes a single text string by removing potentially dangerous characters
 * and HTML/script tags while preserving legitimate content.
 * 
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized text string
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 1000): string {
  if (!text) return '';
  
  // Convert to string and trim
  let sanitized = String(text).trim();
  
  // Truncate to max length to prevent DoS
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove script-related patterns
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, ''); // onclick, onerror, etc.
  
  // Remove potentially dangerous Unicode characters
  // (null bytes, RTL/LTR override, zero-width characters used in attacks)
  sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Sanitizes an array of strings (e.g., genres, tags)
 * 
 * @param arr - Array of strings to sanitize
 * @param maxItems - Maximum number of items to return (default: 50)
 * @param maxItemLength - Maximum length per item (default: 100)
 * @returns Sanitized array of strings
 */
export function sanitizeArray(
  arr: string[] | null | undefined, 
  maxItems: number = 50,
  maxItemLength: number = 100
): string[] {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .slice(0, maxItems) // Limit array size
    .map(item => sanitizeText(item, maxItemLength))
    .filter(item => item.length > 0); // Remove empty items
}

/**
 * Sanitizes a number to prevent injection through numeric fields
 * 
 * @param num - Number to sanitize
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized number or null if invalid
 */
export function sanitizeNumber(
  num: number | string | null | undefined,
  min: number = Number.MIN_SAFE_INTEGER,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  if (num === null || num === undefined) return null;
  
  const parsed = typeof num === 'number' ? num : parseFloat(String(num));
  
  if (isNaN(parsed) || !isFinite(parsed)) return null;
  
  // Clamp to range
  return Math.max(min, Math.min(max, parsed));
}

/**
 * Sanitizes a URL to prevent javascript: and data: URL attacks
 * 
 * @param url - URL to sanitize
 * @param allowedProtocols - Array of allowed protocols (default: ['http', 'https'])
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(
  url: string | null | undefined,
  allowedProtocols: string[] = ['http', 'https']
): string {
  if (!url) return '';
  
  const sanitized = String(url).trim();
  
  try {
    const parsed = new URL(sanitized);
    const protocol = parsed.protocol.replace(':', '').toLowerCase();
    
    if (allowedProtocols.includes(protocol)) {
      return sanitized;
    }
  } catch {
    // Invalid URL, check if it's a relative path
    if (sanitized.startsWith('/') && !sanitized.startsWith('//')) {
      // Relative path is OK (e.g., /images/book.jpg)
      return sanitized;
    }
  }
  
  return '';
}

/**
 * Sanitizes HTML content (only use when absolutely necessary)
 * This should be used sparingly - prefer plain text whenever possible
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML (still use with dangerouslySetInnerHTML carefully)
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  let sanitized = String(html);
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Remove data: URLs (can contain base64 encoded scripts)
  sanitized = sanitized.replace(/href\s*=\s*["']data:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Type guard to check if a value is a safe string
 */
export function isSafeString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  
  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
}

/**
 * Validates and sanitizes book metadata
 * Specifically designed for book title, author, description, etc.
 */
export interface SanitizedBookMetadata {
  title: string;
  author: string;
  description: string;
  genre: string[];
  publisher: string;
  isbn: string;
  language: string;
}

export function sanitizeBookMetadata(metadata: Partial<{
  title?: string | null;
  author?: string | null;
  description?: string | null;
  genre?: string[] | null;
  publisher?: string | null;
  isbn?: string | null;
  language?: string | null;
  publicationYear?: number | null;
}>): Partial<SanitizedBookMetadata> & { publicationYear?: number | null } {
  return {
    title: sanitizeText(metadata.title, 500),
    author: sanitizeText(metadata.author, 200),
    description: sanitizeText(metadata.description, 5000),
    genre: sanitizeArray(metadata.genre, 20, 50),
    publisher: sanitizeText(metadata.publisher, 200),
    isbn: sanitizeText(metadata.isbn, 50),
    language: sanitizeText(metadata.language, 50),
    publicationYear: sanitizeNumber(metadata.publicationYear, 1000, 2100),
  };
}
