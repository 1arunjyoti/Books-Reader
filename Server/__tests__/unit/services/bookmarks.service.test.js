/**
 * Unit tests for Bookmarks Service
 */

jest.mock('../../../config/database', () => ({
  book: {
    findFirst: jest.fn(),
    findMany: jest.fn()
  },
  bookmark: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const bookmarksService = require('../../../services/bookmarks.service');
const prisma = require('../../../config/database');

describe('BookmarksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyBookOwnership', () => {
    test('returns book when found', async () => {
      const book = { id: 'book-1', userId: 'user-1' };
      prisma.book.findFirst.mockResolvedValue(book);

      const result = await bookmarksService.verifyBookOwnership('book-1', 'user-1');
      expect(result).toBe(book);
    });

    test('throws when book not found', async () => {
      prisma.book.findFirst.mockResolvedValue(null);

      await expect(
        bookmarksService.verifyBookOwnership('book-404', 'user-1')
      ).rejects.toThrow('Book not found');
    });
  });

  describe('bookmarkExists', () => {
    test('returns true when bookmark exists', async () => {
      prisma.bookmark.findUnique.mockResolvedValue({ id: 'bm-1' });

      const result = await bookmarksService.bookmarkExists('book-1', 'user-1', 10);
      expect(result).toBe(true);
    });

    test('returns false when bookmark missing', async () => {
      prisma.bookmark.findUnique.mockResolvedValue(null);

      const result = await bookmarksService.bookmarkExists('book-1', 'user-1', 10);
      expect(result).toBe(false);
    });
  });

  describe('createBookmark', () => {
    test('creates bookmark after validation', async () => {
      prisma.book.findFirst.mockResolvedValue({ id: 'book-1', userId: 'user-1' });
      prisma.bookmark.findUnique.mockResolvedValue(null);
      prisma.bookmark.create.mockResolvedValue({ id: 'bm-1', pageNumber: 10 });

      const result = await bookmarksService.createBookmark('user-1', {
        bookId: 'book-1',
        pageNumber: 10,
        note: 'Interesting section'
      });

      expect(prisma.bookmark.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'bm-1', pageNumber: 10 });
    });

    test('throws when required fields missing', async () => {
      await expect(
        bookmarksService.createBookmark('user-1', { pageNumber: 5 })
      ).rejects.toThrow('bookId and pageNumber are required');
    });

    test('throws when bookmark already exists', async () => {
      prisma.book.findFirst.mockResolvedValue({ id: 'book-1', userId: 'user-1' });
      prisma.bookmark.findUnique.mockResolvedValue({ id: 'bm-1' });

      await expect(
        bookmarksService.createBookmark('user-1', { bookId: 'book-1', pageNumber: 10 })
      ).rejects.toThrow('Bookmark already exists for this page');
    });
  });

  describe('getBookmarksByBook', () => {
    test('returns bookmarks sorted by page number', async () => {
      prisma.book.findFirst.mockResolvedValue({ id: 'book-1', userId: 'user-1' });
      const bookmarks = [{ id: 'bm-1', pageNumber: 5 }];
      prisma.bookmark.findMany.mockResolvedValue(bookmarks);

      const result = await bookmarksService.getBookmarksByBook('book-1', 'user-1');
      expect(prisma.bookmark.findMany).toHaveBeenCalledWith({
        where: { bookId: 'book-1', userId: 'user-1' },
        orderBy: { pageNumber: 'asc' }
      });
      expect(result).toBe(bookmarks);
    });
  });

  describe('updateBookmark', () => {
    test('updates bookmark note after verification', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({ id: 'bm-1', userId: 'user-1' });
      prisma.bookmark.update.mockResolvedValue({ id: 'bm-1', note: 'Updated' });

      const result = await bookmarksService.updateBookmark('bm-1', 'user-1', { note: 'Updated' });

      expect(prisma.bookmark.update).toHaveBeenCalledWith({
        where: { id: 'bm-1' },
        data: { note: 'Updated' }
      });
      expect(result).toEqual({ id: 'bm-1', note: 'Updated' });
    });

    test('throws when bookmark not found', async () => {
      prisma.bookmark.findFirst.mockResolvedValue(null);

      await expect(
        bookmarksService.updateBookmark('bm-missing', 'user-1', { note: 'Updated' })
      ).rejects.toThrow('Bookmark not found');
    });
  });

  describe('deleteBookmark', () => {
    test('deletes bookmark after verification', async () => {
      prisma.bookmark.findFirst.mockResolvedValue({ id: 'bm-1', userId: 'user-1' });

      await bookmarksService.deleteBookmark('bm-1', 'user-1');

      expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 'bm-1' } });
    });

    test('throws when bookmark not found', async () => {
      prisma.bookmark.findFirst.mockResolvedValue(null);

      await expect(
        bookmarksService.deleteBookmark('bm-missing', 'user-1')
      ).rejects.toThrow('Bookmark not found');
    });
  });
});
