const booksService = require('../services/books.service');
const logger = require('../utils/logger');

/**
 * Books Controller
 * Handles HTTP requests/responses for books management
 * Business logic delegated to books.service.js
 */

/**
 * Get all books for the authenticated user with advanced filtering
 */
exports.getAllBooks = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get books using service
    const books = await booksService.getAllBooks(userId, req.query);

    res.json({ books });
  } catch (error) {
    logger.error('Error fetching books:', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      error: 'Failed to fetch books',
      message: error.message 
    });
  }
};

/**
 * Get a single book by ID
 */
exports.getBookById = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const book = await booksService.getBookById(id, userId);
    res.json({ book });
    
  } catch (error) {
    logger.error('Error fetching book:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch book',
      message: error.message 
    });
  }
};

/**
 * Generate presigned URL for a book file
 * Supports long-lived URLs (up to 7 days) and adds cache headers
 */
exports.getPresignedUrl = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;
    // Support up to 7 days (604800 seconds) - S3 maximum
    const expiresIn = Math.min(parseInt(req.query.expiresIn) || 3600, 604800);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await booksService.generateBookPresignedUrl(id, userId, expiresIn);
    
    // Add cache headers to reduce redundant API calls
    // Cache for 1 hour less than expiration to ensure URL stays valid
    const cacheMaxAge = Math.max(0, expiresIn - 3600);
    
    res.set({
      'Cache-Control': `private, max-age=${cacheMaxAge}`,
      'Expires': new Date(Date.now() + cacheMaxAge * 1000).toUTCString(),
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Error generating presigned URL:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate presigned URL',
      message: error.message 
    });
  }
};

/**
 * Update book metadata
 */
exports.updateBook = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedBook = await booksService.updateBook(id, userId, req.body);
    res.json({ book: updatedBook });
    
  } catch (error) {
    logger.error('Error updating book:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to update book',
      message: error.message 
    });
  }
};

/**
 * Delete a book
 */
exports.deleteBook = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await booksService.deleteBook(id, userId);
    
    res.json({ 
      success: true, 
      message: 'Book deleted successfully' 
    });
    
  } catch (error) {
    logger.error('Error deleting book:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete book',
      message: error.message 
    });
  }
};

/**
 * Upload a custom cover image for a book
 */
exports.uploadCover = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No cover image uploaded' });
    }

    const result = await booksService.uploadCoverImage(
      id, 
      userId, 
      req.file.buffer, 
      req.file.originalname, 
      req.file.size
    );

    res.json(result);
    
  } catch (error) {
    logger.error('Error uploading cover image:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Invalid file type') || 
        error.message.includes('exceeds')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to upload cover image',
      message: error.message 
    });
  }
};

/**
 * Generate cover for a book
 */
exports.generateCover = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await booksService.generateBookCover(id, userId);
    res.json(result);
    
  } catch (error) {
    logger.error('Error generating cover:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('already has a cover')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate cover',
      message: error.message 
    });
  }
};
