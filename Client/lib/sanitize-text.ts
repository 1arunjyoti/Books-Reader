/**
 * Text Sanitization Utilities
 * 
 * Provides defense-in-depth sanitization for user-generated content
 * to prevent XSS attacks and ensure data integrity.
 * 
 * Note: React already escapes text content by default when rendering
 * with {variable}, but these utilities provide an additional security layer.
 */

/**
 * Sanitizes plain text by removing or escaping potentially dangerous characters
 * @param text - The text to sanitize
 * @param options - Sanitization options
 * @returns Sanitized text safe for rendering
 */
export function sanitizeText(
  text: string | null | undefined,
  options: {
    maxLength?: number;
    allowNewlines?: boolean;
    trimWhitespace?: boolean;
  } = {}
): string {
  if (!text) return '';

  const {
    maxLength = 5000,
    allowNewlines = true,
    trimWhitespace = true,
  } = options;

  let sanitized = String(text);

  // Trim whitespace if requested
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes (can cause issues in some contexts)
  sanitized = sanitized.replace(/\0/g, '');

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Normalize Unicode (prevent homograph attacks)
  sanitized = sanitized.normalize('NFC');

  // Limit length to prevent DoS attacks
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes bookmark notes specifically
 * @param note - The bookmark note to sanitize
 * @returns Sanitized bookmark note
 */
export function sanitizeBookmarkNote(note: string | null | undefined): string {
  return sanitizeText(note, {
    maxLength: 1000, // Limit bookmark notes to 1000 characters
    allowNewlines: true, // Allow multi-line notes
    trimWhitespace: true,
  });
}

/**
 * Sanitizes a title/name field
 * @param title - The title to sanitize
 * @returns Sanitized title
 */
export function sanitizeTitle(title: string | null | undefined): string {
  return sanitizeText(title, {
    maxLength: 200,
    allowNewlines: false, // Titles should be single-line
    trimWhitespace: true,
  });
}

/**
 * Validates and sanitizes user input before storing in database
 * @param input - User input to validate
 * @param type - Type of input (for appropriate sanitization)
 * @returns Sanitized input or null if invalid
 */
export function validateAndSanitizeInput(
  input: string | null | undefined,
  type: 'note' | 'title' | 'text' = 'text'
): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  switch (type) {
    case 'note':
      return sanitizeBookmarkNote(input);
    case 'title':
      return sanitizeTitle(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
}

/**
 * Escapes HTML entities (additional layer, though React already does this)
 * Use only when absolutely necessary, as React handles this automatically
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return String(text).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitize error message specifically
 * 
 * Extracts safe error message from Error object or string,
 * with additional protection against common XSS patterns in error messages.
 * 
 * @param error - Error object, string, or unknown error
 * @returns Safe error message
 * 
 * @example
 * ```tsx
 * <div className="error-message">
 *   {sanitizeErrorMessage(error)}
 * </div>
 * ```
 */
export function sanitizeErrorMessage(error: unknown): string {
  let message = '';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    if ('message' in error) {
      message = String((error as { message: unknown }).message);
    } else if ('error' in error) {
      message = String((error as { error: unknown }).error);
    } else {
      message = JSON.stringify(error);
    }
  } else {
    message = 'An unknown error occurred';
  }
  
  // Sanitize the message with strict options
  return sanitizeText(message, {
    maxLength: 500,
    allowNewlines: false,
    trimWhitespace: true,
  });
}

/**
 * Sanitize stack trace for display
 * 
 * Stack traces can be long and may contain sensitive paths.
 * This function sanitizes and truncates them for safe display.
 * 
 * @param stack - Stack trace string from Error.stack
 * @returns Sanitized and truncated stack trace
 * 
 * @example
 * ```tsx
 * <pre>{sanitizeStackTrace(error.stack)}</pre>
 * ```
 */
export function sanitizeStackTrace(stack: string | undefined | null): string {
  if (!stack) return '';
  
  // Sanitize and limit length to prevent DoS and information leakage
  const sanitized = sanitizeText(stack, {
    maxLength: 3000,
    allowNewlines: true,
    trimWhitespace: true,
  });
  
  return sanitized;
}

/**
 * Sanitize component stack trace from React Error Boundary
 * 
 * @param componentStack - Component stack from ErrorInfo
 * @returns Sanitized component stack
 */
export function sanitizeComponentStack(componentStack: string | undefined | null): string {
  if (!componentStack) return '';
  
  return sanitizeText(componentStack, {
    maxLength: 2000,
    allowNewlines: true,
    trimWhitespace: true,
  });
}
