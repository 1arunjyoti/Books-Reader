const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middleware/clerk-auth');
const { bookOperationsLimiter } = require('../middleware/rateLimiter');
const collectionsController = require('../controllers/collections.controller');

// Get all collections
router.get('/', checkJwt, bookOperationsLimiter, collectionsController.getAllCollections);

// Create a new collection
router.post('/', checkJwt, bookOperationsLimiter, collectionsController.createCollection);

// Update a collection
router.patch('/:id', checkJwt, bookOperationsLimiter, collectionsController.updateCollection);

// Delete a collection
router.delete('/:id', checkJwt, bookOperationsLimiter, collectionsController.deleteCollection);

// Add books to a collection
router.post('/:id/books', checkJwt, bookOperationsLimiter, collectionsController.addBooksToCollection);

// Remove books from a collection
router.delete('/:id/books', checkJwt, bookOperationsLimiter, collectionsController.removeBooksFromCollection);

// Get books in a collection
router.get('/:id/books', checkJwt, bookOperationsLimiter, collectionsController.getCollectionBooks);

module.exports = router;
