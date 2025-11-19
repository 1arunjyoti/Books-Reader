/**
 * Unit tests for Bookmarks Controller
 */
const bookmarksController = require('../../../controllers/bookmarks.controller');
const bookmarksService = require('../../../services/bookmarks.service');
const logger = require('../../../utils/logger');

jest.mock('../../../services/bookmarks.service');
jest.mock('../../../utils/logger');

describe('BookmarksController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      auth: {
        userId: 'user-123'
      },
      params: {},
      query: {},
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('createBookmark', () => {
    test('should create bookmark successfully', async () => {
      const bookmarkData = { bookId: 'book-1', location: 'chapter-1' };
      req.body = bookmarkData;
      const mockBookmark = { id: 'bm-1', ...bookmarkData };
      bookmarksService.createBookmark = jest.fn().mockResolvedValue(mockBookmark);

      await bookmarksController.createBookmark(req, res);

      expect(bookmarksService.createBookmark).toHaveBeenCalledWith('user-123', bookmarkData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ bookmark: mockBookmark });
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await bookmarksController.createBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 when book not found', async () => {
      req.body = { bookId: 'missing', location: 'loc' };
      bookmarksService.createBookmark = jest.fn().mockRejectedValue(new Error('Book not found'));

      await bookmarksController.createBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });

    test('should return 400 for validation errors', async () => {
      req.body = {};
      bookmarksService.createBookmark = jest.fn().mockRejectedValue(new Error('bookId is required'));

      await bookmarksController.createBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bookId is required' });
    });

    test('should return 409 when bookmark already exists', async () => {
      req.body = { bookId: 'book-1', location: 'loc-1' };
      bookmarksService.createBookmark = jest.fn().mockRejectedValue(new Error('Bookmark already exists'));

      await bookmarksController.createBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bookmark already exists' });
    });

    test('should handle unexpected errors with 500', async () => {
      req.body = { bookId: 'book-1', location: 'loc-1' };
      bookmarksService.createBookmark = jest.fn().mockRejectedValue(new Error('Database down'));

      await bookmarksController.createBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create bookmark',
        message: 'Database down'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getBookmarksByBook', () => {
    beforeEach(() => {
      req.params.bookId = 'book-1';
    });

    test('should return bookmarks for book', async () => {
      const bookmarks = [{ id: 'bm-1' }];
      bookmarksService.getBookmarksByBook = jest.fn().mockResolvedValue(bookmarks);

      await bookmarksController.getBookmarksByBook(req, res);

      expect(bookmarksService.getBookmarksByBook).toHaveBeenCalledWith('book-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ bookmarks });
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await bookmarksController.getBookmarksByBook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 when book not found', async () => {
      bookmarksService.getBookmarksByBook = jest.fn().mockRejectedValue(new Error('Book not found'));

      await bookmarksController.getBookmarksByBook(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });

    test('should handle other errors with 500', async () => {
      bookmarksService.getBookmarksByBook = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      await bookmarksController.getBookmarksByBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch bookmarks',
        message: 'Unexpected error'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateBookmark', () => {
    beforeEach(() => {
      req.params.id = 'bookmark-1';
      req.body = { note: 'Updated note' };
    });

    test('should update bookmark successfully', async () => {
      const updatedBookmark = { id: 'bookmark-1', note: 'Updated note' };
      bookmarksService.updateBookmark = jest.fn().mockResolvedValue(updatedBookmark);

      await bookmarksController.updateBookmark(req, res);

      expect(bookmarksService.updateBookmark).toHaveBeenCalledWith('bookmark-1', 'user-123', req.body);
      expect(res.json).toHaveBeenCalledWith({ bookmark: updatedBookmark });
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await bookmarksController.updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 when bookmark not found', async () => {
      bookmarksService.updateBookmark = jest.fn().mockRejectedValue(new Error('Bookmark not found'));

      await bookmarksController.updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bookmark not found' });
    });

    test('should handle other errors with 500', async () => {
      bookmarksService.updateBookmark = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      await bookmarksController.updateBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to update bookmark',
        message: 'Unexpected error'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteBookmark', () => {
    beforeEach(() => {
      req.params.id = 'bookmark-1';
    });

    test('should delete bookmark successfully', async () => {
      bookmarksService.deleteBookmark = jest.fn().mockResolvedValue();

      await bookmarksController.deleteBookmark(req, res);

      expect(bookmarksService.deleteBookmark).toHaveBeenCalledWith('bookmark-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Bookmark deleted successfully'
      });
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await bookmarksController.deleteBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 when bookmark not found', async () => {
      bookmarksService.deleteBookmark = jest.fn().mockRejectedValue(new Error('Bookmark not found'));

      await bookmarksController.deleteBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Bookmark not found' });
    });

    test('should handle other errors with 500', async () => {
      bookmarksService.deleteBookmark = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      await bookmarksController.deleteBookmark(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete bookmark',
        message: 'Unexpected error'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
