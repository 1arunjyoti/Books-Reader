const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middleware/auth');
const { bookOperationsLimiter } = require('../middleware/rateLimiter');
const bookmarksController = require('../controllers/bookmarks.controller');

// Create a bookmark
router.post('/', checkJwt, bookOperationsLimiter, bookmarksController.createBookmark);

// Get all bookmarks for a book
router.get('/:bookId', checkJwt, bookOperationsLimiter, bookmarksController.getBookmarksByBook);

// Update a bookmark
router.patch('/:id', checkJwt, bookOperationsLimiter, bookmarksController.updateBookmark);

// Delete a bookmark
router.delete('/:id', checkJwt, bookOperationsLimiter, bookmarksController.deleteBookmark);

module.exports = router;
