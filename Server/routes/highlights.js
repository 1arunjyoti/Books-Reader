const express = require('express');
const { checkJwt } = require('../middleware/clerk-auth');
const { bookOperationsLimiter } = require('../middleware/rateLimiter');
const { validateBody, validateParams, validateQuery } = require('../middleware/validator');
const {
  createHighlightSchema,
  updateHighlightSchema,
  highlightIdParamSchema,
  highlightBookIdParamSchema,
  highlightSearchQuerySchema,
  highlightFilterQuerySchema,
} = require('../validators/schemas');
const logger = require('../utils/logger');
const {
  createHighlight,
  getHighlightsByBook,
  getHighlightById,
  updateHighlight,
  deleteHighlight,
  deleteHighlightsByBook,
  getHighlightStats,
  searchHighlights,
  filterHighlightsByColor,
} = require('../services/highlight-service');

const router = express.Router();

// Middleware to verify auth
router.use(checkJwt);

// Apply rate limiting to all highlight routes
router.use(bookOperationsLimiter);

/**
 * POST /api/highlights
 * Create a new highlight
 */
router.post('/', validateBody(createHighlightSchema), async (req, res) => {
  try {
    const {
      bookId,
      text,
      cfiRange,
      color,
      hex,
      note,
      pageNumber,
      rects,
      source,
    } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validation
    if (!bookId || !text || !color || !hex) {
      return res.status(400).json({
        error: 'Missing required fields: bookId, text, color, hex',
      });
    }

    const normalizedSource = (source || 'EPUB').toUpperCase();

    if (normalizedSource === 'EPUB') {
      if (!cfiRange) {
        return res.status(400).json({
          error: 'cfiRange is required for EPUB highlights',
        });
      }
    } else if (normalizedSource === 'PDF') {
      if (typeof pageNumber !== 'number' || pageNumber < 1) {
        return res.status(400).json({
          error: 'pageNumber must be a positive integer for PDF highlights',
        });
      }

      if (!Array.isArray(rects) || rects.length === 0) {
        return res.status(400).json({
          error: 'rects array is required for PDF highlights',
        });
      }
    } else if (normalizedSource === 'TXT') {
      // TXT highlights use cfiRange to store position data
      if (!cfiRange) {
        return res.status(400).json({
          error: 'cfiRange is required for TXT highlights',
        });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported highlight source. Must be EPUB, PDF, or TXT.' });
    }

    const highlight = await createHighlight(bookId, userId, {
      text,
      cfiRange,
      pageNumber,
      rects,
      color,
      hex,
      note,
      source: normalizedSource,
    });

    res.status(201).json(highlight);
  } catch (error) {
    logger.error('Error creating highlight:', { error: error.message, stack: error.stack, userId: req.auth.sub });
    if (error.message === 'Highlight already exists at this location') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

/**
 * GET /api/highlights/:bookId
 * Get all highlights for a book
 */
router.get('/:bookId', validateParams(highlightBookIdParamSchema), async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const highlights = await getHighlightsByBook(bookId, userId);

    res.json(highlights);
  } catch (error) {
    logger.error('Error fetching highlights:', { error: error.message, bookId: req.params.bookId, userId: req.auth.sub });
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

/**
 * GET /api/highlights/:bookId/stats
 * Get highlight statistics for a book
 */
router.get('/:bookId/stats', validateParams(highlightBookIdParamSchema), async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await getHighlightStats(bookId, userId);

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching highlight stats:', { error: error.message, bookId: req.params.bookId, userId: req.auth.sub });
    res.status(500).json({ error: 'Failed to fetch highlight stats' });
  }
});

/**
 * GET /api/highlights/:bookId/search?q=query
 * Search highlights by text
 */
router.get('/:bookId/search', 
  validateParams(highlightBookIdParamSchema),
  validateQuery(highlightSearchQuerySchema),
  async (req, res) => {
  try {
    const { bookId } = req.params;
    const { q } = req.query;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const highlights = await searchHighlights(bookId, userId, q);

    res.json(highlights);
  } catch (error) {
    logger.error('Error searching highlights:', { error: error.message, bookId: req.params.bookId, userId: req.auth.sub, query: req.query.q });
    res.status(500).json({ error: 'Failed to search highlights' });
  }
});

/**
 * GET /api/highlights/:bookId/filter?colors=yellow,green
 * Filter highlights by color
 */
router.get('/:bookId/filter', 
  validateParams(highlightBookIdParamSchema),
  validateQuery(highlightFilterQuerySchema),
  async (req, res) => {
  try {
    const { bookId } = req.params;
    const { colors } = req.query;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const colorArray = colors.split(',').map((c) => c.trim());
    const highlights = await filterHighlightsByColor(bookId, userId, colorArray);

    res.json(highlights);
  } catch (error) {
    logger.error('Error filtering highlights:', { error: error.message, bookId: req.params.bookId, userId: req.auth.sub, colors: req.query.colors });
    res.status(500).json({ error: 'Failed to filter highlights' });
  }
});

/**
 * PUT /api/highlights/:highlightId
 * Update a highlight (color, hex, note)
 */
router.put('/:highlightId', 
  validateParams(highlightIdParamSchema),
  validateBody(updateHighlightSchema),
  async (req, res) => {
  try {
    const { highlightId } = req.params;
    const { color, hex, note, rects, pageNumber, source } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updated = await updateHighlight(highlightId, userId, {
      color,
      hex,
      note,
      rects,
      pageNumber,
      source,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Error updating highlight:', { error: error.message, highlightId: req.params.highlightId, userId: req.auth.sub });
    if (error.message === 'Highlight not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update highlight' });
  }
});

/**
 * DELETE /api/highlights/:highlightId
 * Delete a highlight
 */
router.delete('/:highlightId', 
  validateParams(highlightIdParamSchema),
  async (req, res) => {
  try {
    const { highlightId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const deleted = await deleteHighlight(highlightId, userId);

    res.json({ success: true, highlight: deleted });
  } catch (error) {
    logger.error('Error deleting highlight:', { error: error.message, highlightId: req.params.highlightId, userId: req.auth.sub });
    if (error.message === 'Highlight not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

/**
 * DELETE /api/highlights/book/:bookId
 * Delete all highlights for a book (admin/cleanup)
 */
router.delete('/book/:bookId', 
  validateParams(highlightBookIdParamSchema),
  async (req, res) => {
  try {
    const { bookId } = req.params;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await deleteHighlightsByBook(bookId, userId);

    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    logger.error('Error deleting book highlights:', { error: error.message, bookId: req.params.bookId, userId: req.auth.sub });
    res.status(500).json({ error: 'Failed to delete book highlights' });
  }
});

module.exports = router;
