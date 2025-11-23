const bookmarksService = require('../services/bookmarks.service');
const logger = require('../utils/logger');

/**
 * Bookmarks Controller
 * Handles HTTP requests/responses for bookmarks management
 * Business logic delegated to bookmarks.service.js
 */

/**
 * Create a new bookmark
 */
exports.createBookmark = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const bookmark = await bookmarksService.createBookmark(userId, req.body);
    res.status(201).json({ bookmark });
    
  } catch (error) {
    logger.error('Error creating bookmark:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('required')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to create bookmark',
      message: error.message 
    });
  }
};

/**
 * Get all bookmarks for a book
 */
exports.getBookmarksByBook = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { bookId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const bookmarks = await bookmarksService.getBookmarksByBook(bookId, userId);
    res.json({ bookmarks });
    
  } catch (error) {
    logger.error('Error fetching bookmarks:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Book not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch bookmarks',
      message: error.message 
    });
  }
};

/**
 * Update a bookmark
 */
exports.updateBookmark = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updatedBookmark = await bookmarksService.updateBookmark(id, userId, req.body);
    res.json({ bookmark: updatedBookmark });
    
  } catch (error) {
    logger.error('Error updating bookmark:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Bookmark not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to update bookmark',
      message: error.message 
    });
  }
};

/**
 * Delete a bookmark
 */
exports.deleteBookmark = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await bookmarksService.deleteBookmark(id, userId);
    
    res.json({ 
      success: true, 
      message: 'Bookmark deleted successfully' 
    });
    
  } catch (error) {
    logger.error('Error deleting bookmark:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Bookmark not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete bookmark',
      message: error.message 
    });
  }
};
