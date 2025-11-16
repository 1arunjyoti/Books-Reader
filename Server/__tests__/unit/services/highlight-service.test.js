/**
 * Unit tests for Highlight Service
 */

jest.mock('../../../config/database', () => ({
  highlight: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  }
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const prisma = require('../../../config/database');
const highlightService = require('../../../services/highlight-service');

describe('Highlight Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHighlight', () => {
    test('creates highlight successfully', async () => {
      const highlight = { id: 'h1', text: 'quote' };
      prisma.highlight.create.mockResolvedValue(highlight);

      const result = await highlightService.createHighlight('book-1', 'user-1', {
        text: 'quote',
        cfiRange: 'range',
        color: 'yellow',
        hex: '#ffff00'
      });

      expect(prisma.highlight.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookId: 'book-1',
          userId: 'user-1',
          text: 'quote',
          color: 'yellow',
          hex: '#ffff00'
        })
      });
      expect(result).toBe(highlight);
    });

    test('throws friendly error on duplicate highlight', async () => {
      const error = new Error('Unique constraint');
      error.code = 'P2002';
      prisma.highlight.create.mockRejectedValue(error);

      await expect(
        highlightService.createHighlight('book-1', 'user-1', { text: 'quote', color: 'yellow', hex: '#ffff00' })
      ).rejects.toThrow('Highlight already exists at this location');
    });
  });

  describe('getHighlightsByBook', () => {
    test('returns highlights sorted by page', async () => {
      const highlights = [{ id: 'h1' }];
      prisma.highlight.findMany.mockResolvedValue(highlights);

      const result = await highlightService.getHighlightsByBook('book-1', 'user-1');

      expect(prisma.highlight.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book-1', userId: 'user-1' },
        orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }]
      });
      expect(result).toBe(highlights);
    });
  });

  describe('getHighlightById', () => {
    test('returns highlight when found', async () => {
      const highlight = { id: 'h1' };
      prisma.highlight.findFirst.mockResolvedValue(highlight);

      const result = await highlightService.getHighlightById('h1', 'user-1');
      expect(result).toBe(highlight);
    });
  });

  describe('updateHighlight', () => {
    test('updates highlight after ownership verification', async () => {
      prisma.highlight.findFirst.mockResolvedValue({ id: 'h1', color: 'yellow', hex: '#ffff00', note: 'old' });
      prisma.highlight.update.mockResolvedValue({ id: 'h1', color: 'blue', note: 'new' });

      const result = await highlightService.updateHighlight('h1', 'user-1', { color: 'blue', note: 'new' });

      expect(prisma.highlight.update).toHaveBeenCalledWith({
        where: { id: 'h1' },
        data: expect.objectContaining({ color: 'blue', note: 'new' })
      });
      expect(result).toEqual({ id: 'h1', color: 'blue', note: 'new' });
    });

    test('throws when highlight not found', async () => {
      prisma.highlight.findFirst.mockResolvedValue(null);

      await expect(
        highlightService.updateHighlight('missing', 'user-1', { color: 'blue' })
      ).rejects.toThrow('Highlight not found or unauthorized');
    });
  });

  describe('deleteHighlight', () => {
    test('deletes highlight when owned by user', async () => {
      prisma.highlight.findFirst.mockResolvedValue({ id: 'h1' });
      prisma.highlight.delete.mockResolvedValue({ id: 'h1' });

      const result = await highlightService.deleteHighlight('h1', 'user-1');

      expect(prisma.highlight.delete).toHaveBeenCalledWith({ where: { id: 'h1' } });
      expect(result).toEqual({ id: 'h1' });
    });

    test('throws when highlight missing', async () => {
      prisma.highlight.findFirst.mockResolvedValue(null);

      await expect(
        highlightService.deleteHighlight('missing', 'user-1')
      ).rejects.toThrow('Highlight not found or unauthorized');
    });
  });

  describe('deleteHighlightsByBook', () => {
    test('deletes multiple highlights for book', async () => {
      prisma.highlight.deleteMany.mockResolvedValue({ count: 3 });

      const result = await highlightService.deleteHighlightsByBook('book-1', 'user-1');

      expect(prisma.highlight.deleteMany).toHaveBeenCalledWith({ where: { bookId: 'book-1', userId: 'user-1' } });
      expect(result).toEqual({ count: 3 });
    });
  });

  describe('getHighlightStats', () => {
    test('computes statistics for highlights', async () => {
      const today = new Date();
      prisma.highlight.findMany.mockResolvedValue([
        { color: 'yellow', note: 'note', createdAt: today },
        { color: 'yellow', note: null, createdAt: new Date(Date.now() - 86400000) },
        { color: 'blue', note: 'note', createdAt: today }
      ]);

      const stats = await highlightService.getHighlightStats('book-1', 'user-1');

      expect(stats.total).toBe(3);
      expect(stats.byColor.yellow).toBe(2);
      expect(stats.withNotes).toBe(2);
      expect(stats.createdToday).toBeGreaterThan(0);
    });
  });

  describe('searchHighlights', () => {
    test('searches highlights by text', async () => {
      const highlights = [{ id: 'h1' }];
      prisma.highlight.findMany.mockResolvedValue(highlights);

      const result = await highlightService.searchHighlights('book-1', 'user-1', 'quote');

      expect(prisma.highlight.findMany).toHaveBeenCalledWith({
        where: {
          bookId: 'book-1',
          userId: 'user-1',
          text: {
            contains: 'quote',
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      expect(result).toBe(highlights);
    });
  });

  describe('filterHighlightsByColor', () => {
    test('filters by single color', async () => {
      prisma.highlight.findMany.mockResolvedValue([{ id: 'h1' }]);

      await highlightService.filterHighlightsByColor('book-1', 'user-1', 'yellow');

      expect(prisma.highlight.findMany).toHaveBeenCalledWith({
        where: {
          bookId: 'book-1',
          userId: 'user-1',
          color: { in: ['yellow'] }
        },
        orderBy: { createdAt: 'asc' }
      });
    });

    test('filters by multiple colors', async () => {
      prisma.highlight.findMany.mockResolvedValue([{ id: 'h1' }]);

      await highlightService.filterHighlightsByColor('book-1', 'user-1', ['yellow', 'blue']);

      expect(prisma.highlight.findMany).toHaveBeenCalledWith({
        where: {
          bookId: 'book-1',
          userId: 'user-1',
          color: { in: ['yellow', 'blue'] }
        },
        orderBy: { createdAt: 'asc' }
      });
    });
  });
});
