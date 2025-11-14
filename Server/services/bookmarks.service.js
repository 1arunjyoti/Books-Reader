const prisma = require('../config/database');
const logger = require('../utils/logger');
const { randomUUID } = require('crypto');

/**
 * Bookmarks Service
 * Handles all business logic related to bookmarks management
 */

class BookmarksService {
  /**
   * Verify book ownership
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Book object
   * @throws {Error} If book not found or doesn't belong to user
   */
  async verifyBookOwnership(bookId, userId) {
    const book = await prisma.book.findFirst({
      where: { id: bookId, userId }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    return book;
  }

  /**
   * Check if bookmark already exists
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @param {number} pageNumber - Page number
   * @returns {Promise<boolean>} True if bookmark exists
   */
  async bookmarkExists(bookId, userId, pageNumber) {
    const existing = await prisma.bookmark.findUnique({
      where: {
        bookId_userId_pageNumber: {
          bookId,
          userId,
          pageNumber
        }
      }
    });

    return !!existing;
  }

  /**
   * Create a new bookmark
   * @param {string} userId - User ID
   * @param {Object} bookmarkData - Bookmark data
   * @returns {Promise<Object>} Created bookmark
   * @throws {Error} If validation fails or bookmark already exists
   */
  async createBookmark(userId, bookmarkData) {
    const { bookId, pageNumber, note } = bookmarkData;

    // Validate required fields
    if (!bookId || !pageNumber) {
      throw new Error('bookId and pageNumber are required');
    }

    // Verify book belongs to user
    await this.verifyBookOwnership(bookId, userId);

    // Check if bookmark already exists for this page
    const exists = await this.bookmarkExists(bookId, userId, pageNumber);
    if (exists) {
      throw new Error('Bookmark already exists for this page');
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        id: randomUUID(),
        bookId,
        userId,
        pageNumber,
        note: note || null
      }
    });

    logger.info('Bookmark created', { 
      bookmarkId: bookmark.id, 
      userId, 
      bookId, 
      pageNumber 
    });

    return bookmark;
  }

  /**
   * Get all bookmarks for a book
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of bookmarks
   */
  async getBookmarksByBook(bookId, userId) {
    // Verify book belongs to user
    await this.verifyBookOwnership(bookId, userId);

    // Fetch all bookmarks for this book
    const bookmarks = await prisma.bookmark.findMany({
      where: { bookId, userId },
      orderBy: { pageNumber: 'asc' }
    });

    logger.debug('Bookmarks fetched for book', { 
      bookId, 
      userId, 
      count: bookmarks.length 
    });

    return bookmarks;
  }

  /**
   * Verify bookmark ownership
   * @param {string} bookmarkId - Bookmark ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Bookmark object
   * @throws {Error} If bookmark not found or doesn't belong to user
   */
  async verifyBookmarkOwnership(bookmarkId, userId) {
    const bookmark = await prisma.bookmark.findFirst({
      where: { id: bookmarkId, userId }
    });

    if (!bookmark) {
      throw new Error('Bookmark not found');
    }

    return bookmark;
  }

  /**
   * Update a bookmark
   * @param {string} bookmarkId - Bookmark ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated bookmark
   */
  async updateBookmark(bookmarkId, userId, updateData) {
    // Verify bookmark ownership
    await this.verifyBookmarkOwnership(bookmarkId, userId);

    const { note } = updateData;

    // Update bookmark
    const updatedBookmark = await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { note: note || null }
    });

    logger.info('Bookmark updated', { bookmarkId, userId });
    return updatedBookmark;
  }

  /**
   * Delete a bookmark
   * @param {string} bookmarkId - Bookmark ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteBookmark(bookmarkId, userId) {
    // Verify bookmark ownership
    await this.verifyBookmarkOwnership(bookmarkId, userId);

    // Delete bookmark
    await prisma.bookmark.delete({
      where: { id: bookmarkId }
    });

    logger.info('Bookmark deleted', { bookmarkId, userId });
  }
}

module.exports = new BookmarksService();
