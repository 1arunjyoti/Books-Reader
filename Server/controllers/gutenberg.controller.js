const gutenbergService = require('../services/gutenberg.service');
const logger = require('../utils/logger');

/**
 * Gutenberg Controller
 */

/**
 * Import a book from Project Gutenberg
 * Expects body: { bookData: Object }
 */
exports.importBook = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { bookData } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!bookData || !bookData.id) {
      return res.status(400).json({ error: 'Invalid book data provided' });
    }

    const book = await gutenbergService.importBook(userId, bookData);

    res.status(201).json({
      success: true,
      message: 'Book imported successfully',
      book
    });

  } catch (error) {
    logger.error('Error importing Gutenberg book:', { error: error.message, stack: error.stack });
    
    // Handle specific errors if needed
    if (error.message.includes('No suitable download format')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to import book',
      message: error.message
    });
  }
};
