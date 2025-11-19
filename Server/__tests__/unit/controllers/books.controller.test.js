/**
 * Unit tests for Books Controller
 */
const booksController = require('../../../controllers/books.controller');
const booksService = require('../../../services/books.service');
const logger = require('../../../utils/logger');

// Mock dependencies
jest.mock('../../../services/books.service');
jest.mock('../../../utils/logger');

describe('BooksController', () => {
  let req, res, next;

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
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('getAllBooks', () => {
    test('should return all books for authenticated user', async () => {
      const mockBooks = [
        { id: '1', title: 'Book 1' },
        { id: '2', title: 'Book 2' }
      ];
      
      booksService.getAllBooks = jest.fn().mockResolvedValue(mockBooks);

      await booksController.getAllBooks(req, res);

      expect(booksService.getAllBooks).toHaveBeenCalledWith('user-123', {});
      expect(res.json).toHaveBeenCalledWith({ books: mockBooks });
    });

    test('should return 401 if user not authenticated', async () => {
      req.auth = null;

      await booksController.getAllBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should pass query parameters to service', async () => {
      req.query = { search: 'test', status: 'reading' };
      booksService.getAllBooks = jest.fn().mockResolvedValue([]);

      await booksController.getAllBooks(req, res);

      expect(booksService.getAllBooks).toHaveBeenCalledWith('user-123', req.query);
    });

    test('should handle service errors', async () => {
      booksService.getAllBooks = jest.fn().mockRejectedValue(new Error('Database error'));

      await booksController.getAllBooks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch books',
        message: 'Database error'
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getBookById', () => {
    test('should return book by ID', async () => {
      const mockBook = { id: '1', title: 'Test Book' };
      req.params.id = '1';
      
      booksService.getBookById = jest.fn().mockResolvedValue(mockBook);

      await booksController.getBookById(req, res);

      expect(booksService.getBookById).toHaveBeenCalledWith('1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ book: mockBook });
    });

    test('should return 401 if user not authenticated', async () => {
      req.auth = null;
      req.params.id = '1';

      await booksController.getBookById(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 if book not found', async () => {
      req.params.id = '999';
      booksService.getBookById = jest.fn().mockRejectedValue(new Error('Book not found'));

      await booksController.getBookById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });

    test('should handle other errors', async () => {
      req.params.id = '1';
      booksService.getBookById = jest.fn().mockRejectedValue(new Error('Database error'));

      await booksController.getBookById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to fetch book',
        message: 'Database error'
      });
    });
  });

  describe('getPresignedUrl', () => {
    test('should generate presigned URL with default expiration', async () => {
      req.params.id = '1';
      const mockResult = {
        fileUrl: 'https://cdn.example.com/signed-url',
        expiresIn: 3600
      };
      
      booksService.generateBookPresignedUrl = jest.fn().mockResolvedValue(mockResult);

      await booksController.getPresignedUrl(req, res);

      expect(booksService.generateBookPresignedUrl).toHaveBeenCalledWith('1', 'user-123', 3600);
      expect(res.set).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    test('should use custom expiration from query', async () => {
      req.params.id = '1';
      req.query.expiresIn = '7200';
      
      booksService.generateBookPresignedUrl = jest.fn().mockResolvedValue({});

      await booksController.getPresignedUrl(req, res);

      expect(booksService.generateBookPresignedUrl).toHaveBeenCalledWith('1', 'user-123', 7200);
    });

    test('should limit expiration to maximum 7 days', async () => {
      req.params.id = '1';
      req.query.expiresIn = '999999'; // More than 7 days
      
      booksService.generateBookPresignedUrl = jest.fn().mockResolvedValue({});

      await booksController.getPresignedUrl(req, res);

      expect(booksService.generateBookPresignedUrl).toHaveBeenCalledWith('1', 'user-123', 604800);
    });

    test('should set cache headers', async () => {
      req.params.id = '1';
      req.query.expiresIn = '3600';
      
      booksService.generateBookPresignedUrl = jest.fn().mockResolvedValue({});

      await booksController.getPresignedUrl(req, res);

      expect(res.set).toHaveBeenCalledWith(expect.objectContaining({
        'Cache-Control': expect.stringContaining('private'),
        'Expires': expect.any(String)
      }));
    });

    test('should return 401 if user not authenticated', async () => {
      req.auth = null;
      req.params.id = '1';

      await booksController.getPresignedUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    test('should return 404 if book not found', async () => {
      req.params.id = '999';
      booksService.generateBookPresignedUrl = jest.fn()
        .mockRejectedValue(new Error('Book not found'));

      await booksController.getPresignedUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Book not found' });
    });
  });

  describe('updateBook', () => {
    test('should update book successfully', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Title',
        author: 'Updated Author'
      };
      
      const mockUpdatedBook = { id: '1', ...req.body };
      booksService.updateBook = jest.fn().mockResolvedValue(mockUpdatedBook);

      await booksController.updateBook(req, res);

      expect(booksService.updateBook).toHaveBeenCalledWith('1', 'user-123', req.body);
      expect(res.json).toHaveBeenCalledWith({ book: mockUpdatedBook });
    });

    test('should return 401 if user not authenticated', async () => {
      req.auth = null;
      req.params.id = '1';

      await booksController.updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle update errors', async () => {
      req.params.id = '1';
      req.body = { title: 'Test' };
      booksService.updateBook = jest.fn().mockRejectedValue(new Error('Update failed'));

      await booksController.updateBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteBook', () => {
    test('should delete book successfully', async () => {
      req.params.id = '1';
      booksService.deleteBook = jest.fn().mockResolvedValue({ id: '1' });

      await booksController.deleteBook(req, res);

      expect(booksService.deleteBook).toHaveBeenCalledWith('1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ 
        success: true,
        message: 'Book deleted successfully' 
      });
    });

    test('should return 401 if user not authenticated', async () => {
      req.auth = null;
      req.params.id = '1';

      await booksController.deleteBook(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle delete errors', async () => {
      req.params.id = '1';
      booksService.deleteBook = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await booksController.deleteBook(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
