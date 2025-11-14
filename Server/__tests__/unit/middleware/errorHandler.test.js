/**
 * Unit tests for Error Handler Middleware
 */
const { errorHandler } = require('../../../middleware/errorHandler');
const multer = require('multer');
const logger = require('../../../utils/logger');

jest.mock('../../../utils/logger');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test',
      method: 'POST'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('Multer errors', () => {
    test('should handle LIMIT_FILE_SIZE error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');
      
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'File size exceeds 100MB limit' 
      });
    });

    test('should handle other Multer errors', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
      error.message = 'Unexpected file field';
      
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Unexpected file field' 
      });
    });
  });

  describe('Generic errors', () => {
    test('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Internal server error' 
      });
    });

    test('should log generic errors', () => {
      const error = new Error('Database connection failed');
      error.stack = 'Error stack trace...';
      
      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          error: 'Database connection failed',
          stack: error.stack,
          url: '/api/test',
          method: 'POST'
        })
      );
    });

    test('should handle errors without stack trace', () => {
      const error = new Error('Simple error');
      delete error.stack;
      
      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Request context', () => {
    test('should log request URL and method', () => {
      req.originalUrl = '/api/books/upload';
      req.method = 'POST';
      const error = new Error('Test error');
      
      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        'Unhandled error',
        expect.objectContaining({
          url: '/api/books/upload',
          method: 'POST'
        })
      );
    });
  });
});
