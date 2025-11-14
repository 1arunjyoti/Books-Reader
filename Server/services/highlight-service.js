const prisma = require('../config/database');
const { randomUUID } = require('crypto');

/**
 * Create a new highlight
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @param {object} highlightData - Highlight data { text, cfiRange, color, hex, note? }
 * @returns {Promise<object>} The created highlight
 */
const createHighlight = async (bookId, userId, highlightData) => {
  try {
    const highlight = await prisma.highlight.create({
      data: {
        id: randomUUID(),
        bookId,
        userId,
        text: highlightData.text,
        cfiRange: highlightData.cfiRange || null,
        pageNumber: highlightData.pageNumber ?? null,
        rects: highlightData.rects ?? null,
        color: highlightData.color,
        hex: highlightData.hex,
        note: highlightData.note || null,
        source: highlightData.source || 'EPUB',
      },
    });
    return highlight;
  } catch (error) {
    // Handle unique constraint violation (duplicate highlight at same location)
    if (error.code === 'P2002') {
      throw new Error('Highlight already exists at this location');
    }
    throw error;
  }
};

/**
 * Get all highlights for a book by user
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @returns {Promise<array>} Array of highlights
 */
const getHighlightsByBook = async (bookId, userId) => {
  try {
    const highlights = await prisma.highlight.findMany({
      where: {
        bookId,
        userId,
      },
      orderBy: [
        { pageNumber: 'asc' },
        { createdAt: 'asc' },
      ],
    });
    return highlights;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single highlight by ID
 * @param {string} highlightId - The highlight ID
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<object>} The highlight
 */
const getHighlightById = async (highlightId, userId) => {
  try {
    const highlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        userId,
      },
    });
    return highlight;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a highlight (color, note)
 * @param {string} highlightId - The highlight ID
 * @param {string} userId - The user ID (for authorization)
 * @param {object} updateData - Data to update { color?, hex?, note? }
 * @returns {Promise<object>} The updated highlight
 */
const updateHighlight = async (highlightId, userId, updateData) => {
  try {
    // Verify ownership before updating
    const highlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        userId,
      },
    });

    if (!highlight) {
      throw new Error('Highlight not found or unauthorized');
    }

    const updated = await prisma.highlight.update({
      where: {
        id: highlightId,
      },
      data: {
        color: updateData.color || highlight.color,
        hex: updateData.hex || highlight.hex,
        note: updateData.note !== undefined ? updateData.note : highlight.note,
        rects: updateData.rects ?? highlight.rects,
        pageNumber: updateData.pageNumber ?? highlight.pageNumber,
        source: updateData.source || highlight.source,
      },
    });
    return updated;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a highlight
 * @param {string} highlightId - The highlight ID
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<object>} The deleted highlight
 */
const deleteHighlight = async (highlightId, userId) => {
  try {
    // Verify ownership before deleting
    const highlight = await prisma.highlight.findFirst({
      where: {
        id: highlightId,
        userId,
      },
    });

    if (!highlight) {
      throw new Error('Highlight not found or unauthorized');
    }

    const deleted = await prisma.highlight.delete({
      where: {
        id: highlightId,
      },
    });
    return deleted;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete all highlights for a book (when book is deleted)
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<object>} Delete result with count
 */
const deleteHighlightsByBook = async (bookId, userId) => {
  try {
    const result = await prisma.highlight.deleteMany({
      where: {
        bookId,
        userId,
      },
    });
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Get highlight statistics for a book
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Statistics object
 */
const getHighlightStats = async (bookId, userId) => {
  try {
    const highlights = await prisma.highlight.findMany({
      where: {
        bookId,
        userId,
      },
    });

    // Calculate statistics
    const stats = {
      total: highlights.length,
      byColor: {},
      withNotes: 0,
      createdToday: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    highlights.forEach((h) => {
      // Count by color
      stats.byColor[h.color] = (stats.byColor[h.color] || 0) + 1;

      // Count highlights with notes
      if (h.note) {
        stats.withNotes++;
      }

      // Count highlights created today
      const highlightDate = new Date(h.createdAt);
      highlightDate.setHours(0, 0, 0, 0);
      if (highlightDate.getTime() === today.getTime()) {
        stats.createdToday++;
      }
    });

    return stats;
  } catch (error) {
    throw error;
  }
};

/**
 * Search highlights by text content
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @param {string} query - Search query
 * @returns {Promise<array>} Matching highlights
 */
const searchHighlights = async (bookId, userId, query) => {
  try {
    const highlights = await prisma.highlight.findMany({
      where: {
        bookId,
        userId,
        text: {
          contains: query,
          mode: 'insensitive', // Case-insensitive search
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return highlights;
  } catch (error) {
    throw error;
  }
};

/**
 * Filter highlights by color
 * @param {string} bookId - The book ID
 * @param {string} userId - The user ID
 * @param {string|array} colors - Single color or array of colors to filter by
 * @returns {Promise<array>} Filtered highlights
 */
const filterHighlightsByColor = async (bookId, userId, colors) => {
  try {
    const colorArray = Array.isArray(colors) ? colors : [colors];
    const highlights = await prisma.highlight.findMany({
      where: {
        bookId,
        userId,
        color: {
          in: colorArray,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return highlights;
  } catch (error) {
    throw error;
  }
};

// Export all functions
module.exports = {
  createHighlight,
  getHighlightsByBook,
  getHighlightById,
  updateHighlight,
  deleteHighlight,
  deleteHighlightsByBook,
  getHighlightStats,
  searchHighlights,
  filterHighlightsByColor,
};
