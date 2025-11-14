const collectionsService = require('../services/collections.service');
const logger = require('../utils/logger');

/**
 * Collections Controller
 * Handles HTTP requests/responses for collections management
 * Business logic delegated to collections.service.js
 */

/**
 * Get all collections for the user
 */
exports.getAllCollections = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collections = await collectionsService.getAllCollections(userId);
    res.json(collections);
    
  } catch (error) {
    logger.error('Error fetching collections:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
};

/**
 * Create a new collection
 */
exports.createCollection = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const collection = await collectionsService.createCollection(userId, req.body);
    res.json(collection);
    
  } catch (error) {
    logger.error('Error creating collection:', { error: error.message, stack: error.stack });
    
    if (error.message.includes('required') || 
        error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create collection' });
  }
};

/**
 * Update a collection
 */
exports.updateCollection = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const updated = await collectionsService.updateCollection(id, userId, req.body);
    res.json(updated);
    
  } catch (error) {
    logger.error('Error updating collection:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update collection' });
  }
};

/**
 * Delete a collection
 */
exports.deleteCollection = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await collectionsService.deleteCollection(id, userId);
    res.json({ message: 'Collection deleted successfully' });
    
  } catch (error) {
    logger.error('Error deleting collection:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Cannot delete default')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to delete collection' });
  }
};

/**
 * Add books to a collection
 */
exports.addBooksToCollection = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { bookIds } = req.body;

    const updated = await collectionsService.addBooksToCollection(id, userId, bookIds);
    res.json(updated);
    
  } catch (error) {
    logger.error('Error adding books to collection:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('must be') || 
        error.message.includes('not found') ||
        error.message.includes('do not belong')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to add books to collection' });
  }
};

/**
 * Remove books from a collection
 */
exports.removeBooksFromCollection = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { bookIds } = req.body;

    const updated = await collectionsService.removeBooksFromCollection(id, userId, bookIds);
    res.json(updated);
    
  } catch (error) {
    logger.error('Error removing books from collection:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('must be')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to remove books from collection' });
  }
};

/**
 * Get books in a collection
 */
exports.getCollectionBooks = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await collectionsService.getCollectionBooks(id, userId);
    res.json(result);
    
  } catch (error) {
    logger.error('Error fetching collection books:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Collection not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to fetch collection books' });
  }
};
