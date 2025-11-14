import {
  sanitizeText,
  sanitizeArray,
  sanitizeNumber,
  sanitizeUrl,
  sanitizeBookMetadata,
} from '@/lib/sanitize';

describe('XSS Protection - sanitizeText', () => {
  test('removes script tags', () => {
    expect(sanitizeText("<script>alert('XSS')</script>")).toBe("alert('XSS')");
  });

  test('removes event handlers', () => {
    expect(sanitizeText('<img onerror="alert(1)">')).toBe('');
  });

  test('removes javascript: protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  test('removes data: protocol', () => {
    expect(sanitizeText('data:text/html,<script>alert(1)</script>')).toBe(
      'data:text/html,alert(1)'
    );
  });

  test('removes all HTML tags', () => {
    expect(sanitizeText('<b>Bold</b> <i>italic</i>')).toBe('Bold italic');
  });

  test('removes iframe tags', () => {
    expect(sanitizeText('<iframe src="evil.com"></iframe>')).toBe('');
  });

  test('removes object/embed tags', () => {
    expect(sanitizeText('<object data="evil.swf"></object>')).toBe('');
    expect(sanitizeText('<embed src="evil.swf">')).toBe('');
  });

  test('removes multiple attack vectors', () => {
    const input = '<script>alert(1)</script><img onerror="alert(2)">';
    expect(sanitizeText(input)).toBe('alert(1)');
  });

  test('handles Unicode-based attacks', () => {
    expect(sanitizeText('\u003cscript\u003ealert(1)\u003c/script\u003e')).toBe(
      'alert(1)'
    );
  });

  test('truncates to max length', () => {
    const longString = 'A'.repeat(1000);
    expect(sanitizeText(longString, 100).length).toBe(100);
  });

  test('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });

  test('handles null/undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  test('handles normal text', () => {
    expect(sanitizeText('Hello World')).toBe('Hello World');
  });

  test('normalizes whitespace', () => {
    expect(sanitizeText('Hello   World')).toBe('Hello World');
  });

  test('handles HTML entities', () => {
    // HTML entities are left as-is (browser will handle them safely)
    expect(sanitizeText('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;'
    );
  });
});

describe('XSS Protection - sanitizeArray', () => {
  test('sanitizes all array elements', () => {
    const input = ['<script>evil</script>', 'Normal', '<b>Bold</b>'];
    expect(sanitizeArray(input)).toEqual(['evil', 'Normal', 'Bold']);
  });

  test('enforces max length per item', () => {
    const input = ['A'.repeat(100), 'Short'];
    const result = sanitizeArray(input, 50, 10);
    expect(result[0].length).toBe(10);
  });

  test('enforces max array size', () => {
    const input = Array(100).fill('item');
    expect(sanitizeArray(input, 20, 50).length).toBe(20);
  });

  test('handles empty array', () => {
    expect(sanitizeArray([])).toEqual([]);
  });

  test('handles non-array input', () => {
    expect(sanitizeArray(null)).toEqual([]);
    expect(sanitizeArray(undefined)).toEqual([]);
  });

  test('filters out empty strings after sanitization', () => {
    const input = ['<script></script>', 'Valid', ''];
    const result = sanitizeArray(input);
    expect(result).toEqual(['Valid']);
  });
});

describe('XSS Protection - sanitizeNumber', () => {
  test('returns valid numbers', () => {
    expect(sanitizeNumber(42)).toBe(42);
    expect(sanitizeNumber(3.14)).toBe(3.14);
  });

  test('clamps to min value', () => {
    expect(sanitizeNumber(-100, 0, 100)).toBe(0);
  });

  test('clamps to max value', () => {
    expect(sanitizeNumber(200, 0, 100)).toBe(100);
  });

  test('handles NaN', () => {
    expect(sanitizeNumber(NaN)).toBe(null);
    expect(sanitizeNumber(NaN, 10, 100)).toBe(null);
  });

  test('handles Infinity', () => {
    expect(sanitizeNumber(Infinity, 0, 100)).toBe(null);
    expect(sanitizeNumber(-Infinity, 0, 100)).toBe(null);
  });

  test('handles string numbers', () => {
    expect(sanitizeNumber('42')).toBe(42);
  });

  test('handles invalid input', () => {
    expect(sanitizeNumber('not a number')).toBe(null);
    expect(sanitizeNumber(null)).toBe(null);
    expect(sanitizeNumber(undefined)).toBe(null);
  });
});

describe('XSS Protection - sanitizeUrl', () => {
  test('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  test('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  test('blocks javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  test('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  test('blocks vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('');
  });

  test('handles empty/invalid URLs', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
  });

  test('handles relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });
});

describe('XSS Protection - sanitizeBookMetadata', () => {
  test('sanitizes all book fields', () => {
    const input = {
      title: '<script>Evil</script>Book',
      author: '<img onerror="alert(1)">',
      description: '<b>Description</b>',
      genre: ['<script>evil</script>', 'Fiction'],
      publisher: 'Publisher<script>',
      publicationYear: 2025,
      isbn: '978-0-123456-78-9',
    };

    const result = sanitizeBookMetadata(input);

    expect(result.title).toBe('EvilBook');
    expect(result.author).toBe('');
    expect(result.description).toBe('Description');
    expect(result.genre).toEqual(['evil', 'Fiction']);
    expect(result.publisher).toBe('Publisher');
  });

  test('enforces title length limit', () => {
    const input = { title: 'A'.repeat(1000) };
    const result = sanitizeBookMetadata(input);
    expect(result.title?.length).toBe(500);
  });

  test('enforces author length limit', () => {
    const input = { author: 'A'.repeat(1000) };
    const result = sanitizeBookMetadata(input);
    expect(result.author?.length).toBe(200);
  });

  test('enforces description length limit', () => {
    const input = { description: 'A'.repeat(10000) };
    const result = sanitizeBookMetadata(input);
    expect(result.description?.length).toBe(5000);
  });

  test('clamps publication year', () => {
    expect(sanitizeBookMetadata({ publicationYear: 3000 }).publicationYear).toBe(2100);
    expect(sanitizeBookMetadata({ publicationYear: 1000 }).publicationYear).toBe(1000);
  });

  test('limits genre array size', () => {
    const input = { genre: Array(100).fill('Genre') };
    const result = sanitizeBookMetadata(input);
    expect(result.genre?.length).toBe(20);
  });

  test('handles partial metadata', () => {
    const input = { title: 'Book' };
    const result = sanitizeBookMetadata(input);
    expect(result.title).toBe('Book');
    expect(result.author).toBe('');
  });

  test('handles empty metadata', () => {
    const result = sanitizeBookMetadata({});
    expect(result.title).toBe('');
    expect(result.author).toBe('');
    expect(result.description).toBe('');
    expect(result.genre).toEqual([]);
  });

  test('removes ISBN formatting attacks', () => {
    const input = { isbn: '<script>alert(1)</script>978-0-123456-78-9' };
    expect(sanitizeBookMetadata(input).isbn).toBe('alert(1)978-0-123456-78-9');
  });

  test('handles complex attack scenario', () => {
    const input = {
      title: '<script>alert(document.cookie)</script>Hacked Book',
      author: 'javascript:void(0)<img onerror="alert(1)">',
      description: '<iframe src="evil.com"></iframe>Great book!',
      genre: [
        '<script>evil</script>',
        'Fiction',
        '<b onclick="alert(1)">Horror</b>',
      ],
    };

    const result = sanitizeBookMetadata(input);

    expect(result.title).toBe('alert(document.cookie)Hacked Book');
    expect(result.author).toBe('void(0)');
    expect(result.description).toBe('Great book!');
    expect(result.genre).toEqual(['evil', 'Fiction', 'Horror']);
  });
});

describe('XSS Protection - Edge Cases', () => {
  test('handles nested script tags', () => {
    expect(sanitizeText('<scr<script>ipt>alert(1)</scr</script>ipt>')).toBe(
      'ipt>alert(1)ipt>'
    );
  });

  test('handles mixed case attacks', () => {
    expect(sanitizeText('<ScRiPt>alert(1)</sCrIpT>')).toBe('alert(1)');
  });

  test('handles encoded attacks', () => {
    // URL encoding is left as-is (not decoded - prevents bypass attempts)
    expect(sanitizeText('%3Cscript%3Ealert(1)%3C/script%3E')).toBe(
      '%3Cscript%3Ealert(1)%3C/script%3E'
    );
  });

  test('handles null bytes', () => {
    expect(sanitizeText('test\0<script>alert(1)</script>')).toBe(
      'testalert(1)'
    );
  });

  test('handles very long input efficiently', () => {
    const longString = 'A'.repeat(1000000);
    const start = Date.now();
    sanitizeText(longString, 1000);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // Should complete in < 100ms
  });

  test('handles special characters', () => {
    expect(sanitizeText('Hello™ World® ©2024')).toBe('Hello™ World® ©2024');
  });

  test('handles emojis', () => {
    expect(sanitizeText('Hello 👋 World 🌎')).toBe('Hello 👋 World 🌎');
  });
});
