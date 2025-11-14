const express = require('express');
const uploadRoutes = require('./upload.routes');
const booksRoutes = require('./books.routes');
const bookmarksRoutes = require('./bookmarks.routes');
const analyticsRoutes = require('./analytics.routes');
const collectionsRoutes = require('./collections.routes');
const highlightsRoutes = require('./highlights');
const userRoutes = require('./user.routes');

const router = express.Router();

// Mount all route modules
router.use('/upload', uploadRoutes);
router.use('/books', booksRoutes);
router.use('/bookmarks', bookmarksRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/collections', collectionsRoutes);
router.use('/highlights', highlightsRoutes);
router.use('/user', userRoutes);

module.exports = router;
