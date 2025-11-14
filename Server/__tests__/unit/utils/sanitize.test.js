/**
 * Unit tests for sanitize utility functions
 */
const {
  sanitizeText,
  sanitizeArray,
  sanitizeNumber,
  sanitizeISBN,
  sanitizeBookMetadata
} = require('../../../utils/sanitize');

describe('sanitize.js - Input Sanitization', () => {
  describe('sanitizeText', () => {
    test('should return empty string for null or undefined', () => {
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });

    test('should trim whitespace', () => {
      expect(sanitizeText('  hello world  ')).toBe('hello world');
      expect(sanitizeText('\n\ttest\n')).toBe('test');
    });

    test('should remove HTML tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeText('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeText('Hello <img src=x onerror=alert(1)>')).toBe('Hello');
    });

    test('should remove javascript: protocol', () => {
      expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeText('JAVASCRIPT:alert(1)')).toBe('alert(1)');
    });

    test('should remove event handlers', () => {
      expect(sanitizeText('onclick=alert(1)')).toBe('alert(1)');
      expect(sanitizeText('onload=malicious()')).toBe('malicious()');
    });

    test('should remove control characters', () => {
      expect(sanitizeText('hello\x00world')).toBe('helloworld');
      expect(sanitizeText('test\x1Fvalue')).toBe('testvalue');
    });

    test('should remove zero-width characters', () => {
      expect(sanitizeText('hello\u200Bworld')).toBe('helloworld');
      expect(sanitizeText('test\uFEFFvalue')).toBe('testvalue');
    });

    test('should normalize whitespace', () => {
      expect(sanitizeText('hello    world')).toBe('hello world');
      // Newlines are removed by control character filter, then spaces normalized
      expect(sanitizeText('line1\n\nline2')).toBe('line1line2');
    });

    test('should truncate to max length', () => {
      const longText = 'a'.repeat(2000);
      const result = sanitizeText(longText, 1000);
      expect(result.length).toBe(1000);
    });

    test('should handle normal text correctly', () => {
      expect(sanitizeText('Hello, World!')).toBe('Hello, World!');
      expect(sanitizeText('Testing 123')).toBe('Testing 123');
    });

    test('should handle non-string input', () => {
      expect(sanitizeText(123)).toBe('');
      expect(sanitizeText(true)).toBe('');
      expect(sanitizeText({})).toBe('');
    });
  });

  describe('sanitizeArray', () => {
    test('should return empty array for non-array input', () => {
      expect(sanitizeArray(null)).toEqual([]);
      expect(sanitizeArray(undefined)).toEqual([]);
      expect(sanitizeArray('string')).toEqual([]);
      expect(sanitizeArray(123)).toEqual([]);
    });

    test('should sanitize each item in array', () => {
      const input = ['<script>xss</script>', 'normal text', '  spaces  '];
      const expected = ['xss', 'normal text', 'spaces'];
      expect(sanitizeArray(input)).toEqual(expected);
    });

    test('should filter out empty strings', () => {
      const input = ['valid', '', '   ', 'another'];
      const result = sanitizeArray(input);
      expect(result).toEqual(['valid', 'another']);
    });

    test('should truncate array to max items', () => {
      const input = Array(100).fill('test');
      const result = sanitizeArray(input, 10);
      expect(result.length).toBe(10);
    });

    test('should truncate each item to max length', () => {
      const input = ['a'.repeat(200), 'b'.repeat(150)];
      const result = sanitizeArray(input, 50, 100);
      expect(result[0].length).toBe(100);
      expect(result[1].length).toBe(100);
    });

    test('should handle empty array', () => {
      expect(sanitizeArray([])).toEqual([]);
    });
  });

  describe('sanitizeNumber', () => {
    test('should return null for null or undefined', () => {
      expect(sanitizeNumber(null)).toBeNull();
      expect(sanitizeNumber(undefined)).toBeNull();
    });

    test('should parse valid numbers', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber('3.14')).toBe(3.14);
      expect(sanitizeNumber(-10)).toBe(-10);
    });

    test('should return null for NaN', () => {
      expect(sanitizeNumber('not a number')).toBeNull();
      expect(sanitizeNumber('abc')).toBeNull();
    });

    test('should return null for Infinity', () => {
      expect(sanitizeNumber(Infinity)).toBeNull();
      expect(sanitizeNumber(-Infinity)).toBeNull();
    });

    test('should clamp to min value', () => {
      expect(sanitizeNumber(5, 10, 100)).toBe(10);
      expect(sanitizeNumber(-50, 0, 100)).toBe(0);
    });

    test('should clamp to max value', () => {
      expect(sanitizeNumber(150, 0, 100)).toBe(100);
      expect(sanitizeNumber(999, 0, 50)).toBe(50);
    });

    test('should handle negative numbers', () => {
      expect(sanitizeNumber(-42, -100, 0)).toBe(-42);
    });

    test('should handle zero', () => {
      expect(sanitizeNumber(0)).toBe(0);
      expect(sanitizeNumber('0')).toBe(0);
    });
  });

  describe('sanitizeISBN', () => {
    test('should return null for invalid input', () => {
      expect(sanitizeISBN(null)).toBeNull();
      expect(sanitizeISBN(undefined)).toBeNull();
      expect(sanitizeISBN('')).toBeNull();
    });

    test('should accept valid ISBN-10', () => {
      expect(sanitizeISBN('0-306-40615-2')).toBe('0306406152');
      expect(sanitizeISBN('0306406152')).toBe('0306406152');
    });

    test('should accept valid ISBN-13', () => {
      expect(sanitizeISBN('978-3-16-148410-0')).toBe('9783161484100');
      expect(sanitizeISBN('9783161484100')).toBe('9783161484100');
    });

    test('should remove non-alphanumeric characters', () => {
      expect(sanitizeISBN('978-3-16-148410-0')).toBe('9783161484100');
      expect(sanitizeISBN('ISBN: 978-3-16-148410-0')).toBe('9783161484100'); // After removing non-numeric, should be valid
    });

    test('should handle ISBN with X', () => {
      expect(sanitizeISBN('043942089X')).toBe('043942089X');
      expect(sanitizeISBN('043942089x')).toBe('043942089X'); // Uppercase X
    });

    test('should return null for invalid length', () => {
      expect(sanitizeISBN('123')).toBeNull();
      expect(sanitizeISBN('12345678901234')).toBeNull();
    });
  });

  describe('sanitizeBookMetadata', () => {
    test('should return empty object for invalid input', () => {
      expect(sanitizeBookMetadata(null)).toEqual({});
      expect(sanitizeBookMetadata(undefined)).toEqual({});
      expect(sanitizeBookMetadata('string')).toEqual({});
    });

    test('should sanitize title field', () => {
      const input = { title: '<script>xss</script>Book Title' };
      const result = sanitizeBookMetadata(input);
      expect(result.title).toBe('xssBook Title');
    });

    test('should sanitize author field', () => {
      const input = { author: '  John Doe  ' };
      const result = sanitizeBookMetadata(input);
      expect(result.author).toBe('John Doe');
    });

    test('should sanitize and validate ISBN', () => {
      const input = { isbn: '978-3-16-148410-0' };
      const result = sanitizeBookMetadata(input);
      expect(result.isbn).toBe('9783161484100');
    });

    test('should sanitize description', () => {
      const input = { 
        description: 'A <b>great</b> book with <script>alert(1)</script> content' 
      };
      const result = sanitizeBookMetadata(input);
      expect(result.description).toBe('A great book with alert(1) content');
    });

    test('should sanitize arrays like tags', () => {
      const input = { 
        genre: ['<script>xss</script>', 'fiction', '  adventure  '] 
      };
      const result = sanitizeBookMetadata(input);
      expect(result.genre).toEqual(['xss', 'fiction', 'adventure']);
    });

    test('should handle complete book metadata', () => {
      const input = {
        title: 'Test Book',
        author: 'Jane Smith',
        isbn: '9783161484100',
        description: 'A test description',
        publisher: 'Test Publisher',
        publishedYear: 2023
      };
      const result = sanitizeBookMetadata(input);
      expect(result).toHaveProperty('title', 'Test Book');
      expect(result).toHaveProperty('author', 'Jane Smith');
    });
  });
});
