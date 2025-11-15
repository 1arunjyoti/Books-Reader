const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { bookOperationsLimiter, coverGenerationLimiter } = require('../middleware/rateLimiter');
const { validateParams, validateQuery, validateBody } = require('../middleware/validator');
const {
  bookQuerySchema,
  bookIdParamSchema,
  updateBookSchema,
  presignedUrlQuerySchema,
} = require('../validators/schemas');
const booksController = require('../controllers/books.controller');

// Get all books with optional filtering and sorting
router.get('/', 
  checkJwt, 
  bookOperationsLimiter, 
  validateQuery(bookQuerySchema),
  booksController.getAllBooks
);

// Get a specific book
router.get('/:id', 
  checkJwt, 
  bookOperationsLimiter, 
  validateParams(bookIdParamSchema),
  booksController.getBookById
);

// Get presigned URL for a book file
router.get('/:id/presigned-url', 
  checkJwt, 
  bookOperationsLimiter, 
  validateParams(bookIdParamSchema),
  validateQuery(presignedUrlQuerySchema),
  booksController.getPresignedUrl
);

// Update book metadata
router.patch('/:id', 
  checkJwt, 
  bookOperationsLimiter, 
  validateParams(bookIdParamSchema),
  validateBody(updateBookSchema),
  booksController.updateBook
);

// Delete a book
router.delete('/:id', 
  checkJwt, 
  bookOperationsLimiter, 
  validateParams(bookIdParamSchema),
  booksController.deleteBook
);

// Upload custom cover image
router.post('/:id/cover', 
  checkJwt, 
  coverGenerationLimiter, 
  validateParams(bookIdParamSchema),
  upload.single('cover'), 
  booksController.uploadCover
);

// Generate cover for book (if missing or failed previously)
router.post('/:id/generate-cover',
  checkJwt,
  coverGenerationLimiter,
  validateParams(bookIdParamSchema),
  booksController.generateCover
);

module.exports = router;
