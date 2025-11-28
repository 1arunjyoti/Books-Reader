const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middleware/clerk-auth');
const { bookOperationsLimiter } = require('../middleware/rateLimiter');
const gutenbergController = require('../controllers/gutenberg.controller');

// Import a book from Gutenberg
router.post('/import',
  checkJwt,
  bookOperationsLimiter,
  gutenbergController.importBook
);

module.exports = router;
