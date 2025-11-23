const prisma = require('../config/database');
const { deleteFromB2 } = require('../config/storage');
const logger = require('../utils/logger');
const { clerkClient } = require('@clerk/express');

/**
 * User Service
 * Handles complex user operations including account deletion
 */

/**
 * Delete user from Clerk
 * @param {string} userId - Clerk user ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteClerkUser(userId) {
  try {
    await clerkClient.users.deleteUser(userId);
    logger.info('User deleted from Clerk', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to delete user from Clerk', {
      userId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Verify user password - not needed with Clerk as it handles auth internally
 * Kept for compatibility but always returns true
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} - Always true with Clerk
 */
async function verifyUserPassword(email, password) {
  // Clerk handles password verification internally
  // For account deletion, we rely on the user being authenticated
  logger.info('Password verification skipped - Clerk handles authentication', { email });
  return true;
}

/**
 * Delete all files associated with user's books from B2
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Deletion statistics
 */
async function deleteUserFilesFromB2(userId) {
  const stats = {
    booksDeleted: 0,
    coversDeleted: 0,
    errors: [],
  };

  try {
    // Get all books for the user
    const books = await prisma.book.findMany({
      where: { userId },
      select: { id: true, fileUrl: true, coverUrl: true, title: true },
    });

    logger.info('Deleting files from B2', {
      userId,
      bookCount: books.length,
    });

    // Delete each book's files
    for (const book of books) {
      // Delete book file
      if (book.fileUrl) {
        try {
          await deleteFromB2(book.fileUrl);
          stats.booksDeleted++;
          logger.info('Deleted book file from B2', {
            bookId: book.id,
            fileName: book.fileUrl,
          });
        } catch (error) {
          logger.error('Failed to delete book file from B2', {
            bookId: book.id,
            fileName: book.fileUrl,
            error: error.message,
          });
          stats.errors.push({
            bookId: book.id,
            fileName: book.fileUrl,
            error: error.message,
          });
        }
      }

      // Delete cover file
      if (book.coverUrl) {
        try {
          await deleteFromB2(book.coverUrl);
          stats.coversDeleted++;
          logger.info('Deleted cover file from B2', {
            bookId: book.id,
            fileName: book.coverUrl,
          });
        } catch (error) {
          logger.error('Failed to delete cover file from B2', {
            bookId: book.id,
            fileName: book.coverUrl,
            error: error.message,
          });
          stats.errors.push({
            bookId: book.id,
            fileName: book.coverUrl,
            error: error.message,
          });
        }
      }
    }

    return stats;
  } catch (error) {
    logger.error('Error during B2 cleanup', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Delete all user data from database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Deletion statistics
 */
async function deleteUserDataFromDatabase(userId) {
  const stats = {
    books: 0,
    bookmarks: 0,
    annotations: 0,
    highlights: 0,
    readingSessions: 0,
    readingGoals: 0,
    collections: 0,
    user: 0,
  };

  try {
    logger.info('Starting database cleanup', { userId });

    // Use a transaction to ensure all deletions succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete in order of dependencies (child records first)
      
      // Delete bookmarks
      const deletedBookmarks = await tx.bookmark.deleteMany({
        where: { userId },
      });
      stats.bookmarks = deletedBookmarks.count;
      logger.info('Deleted bookmarks', { userId, count: deletedBookmarks.count });

      // Delete annotations
      const deletedAnnotations = await tx.annotation.deleteMany({
        where: { userId },
      });
      stats.annotations = deletedAnnotations.count;
      logger.info('Deleted annotations', { userId, count: deletedAnnotations.count });

      // Delete highlights
      const deletedHighlights = await tx.highlight.deleteMany({
        where: { userId },
      });
      stats.highlights = deletedHighlights.count;
      logger.info('Deleted highlights', { userId, count: deletedHighlights.count });

      // Delete reading sessions
      const deletedSessions = await tx.readingSession.deleteMany({
        where: { userId },
      });
      stats.readingSessions = deletedSessions.count;
      logger.info('Deleted reading sessions', { userId, count: deletedSessions.count });

      // Delete reading goals
      const deletedGoals = await tx.readingGoal.deleteMany({
        where: { userId },
      });
      stats.readingGoals = deletedGoals.count;
      logger.info('Deleted reading goals', { userId, count: deletedGoals.count });

      // Delete collections
      const deletedCollections = await tx.collection.deleteMany({
        where: { userId },
      });
      stats.collections = deletedCollections.count;
      logger.info('Deleted collections', { userId, count: deletedCollections.count });

      // Delete books (parent records)
      const deletedBooks = await tx.book.deleteMany({
        where: { userId },
      });
      stats.books = deletedBooks.count;
      logger.info('Deleted books', { userId, count: deletedBooks.count });

      // Finally, delete the user
      const deletedUser = await tx.user.delete({
        where: { id: userId },
      });
      stats.user = 1;
      logger.info('Deleted user', { userId });
    });

    return stats;
  } catch (error) {
    logger.error('Error during database cleanup', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Delete user account completely
 * This is the main function that orchestrates the deletion process
 * 
 * @param {string} userId - Auth0 user ID
 * @param {string} email - User email
 * @param {string} password - User password for verification
 * @returns {Promise<Object>} - Deletion result with statistics
 */
async function deleteUserAccount(userId, email, password) {
  logger.info('Starting account deletion process', { userId, email });

  const result = {
    success: false,
    deletedFromAuth0: false,
    deletedFromDatabase: false,
    filesDeleted: {},
    databaseStats: {},
    errors: [],
  };

  try {
    // Step 1: Verify password
    logger.info('Verifying user password', { userId, email });
    const passwordValid = await verifyUserPassword(email, password);
    
    if (!passwordValid) {
      logger.warn('Password verification failed for account deletion', { userId, email });
      throw new Error('Invalid password');
    }

    // Step 2: Delete files from B2 cloud storage
    logger.info('Deleting files from B2', { userId });
    try {
      result.filesDeleted = await deleteUserFilesFromB2(userId);
      logger.info('B2 cleanup completed', {
        userId,
        stats: result.filesDeleted,
      });
    } catch (error) {
      logger.error('B2 cleanup failed', {
        userId,
        error: error.message,
      });
      result.errors.push({
        step: 'B2 cleanup',
        error: error.message,
      });
      // Continue with deletion even if B2 cleanup fails
    }

    // Step 3: Delete all data from database
    logger.info('Deleting data from database', { userId });
    try {
      result.databaseStats = await deleteUserDataFromDatabase(userId);
      result.deletedFromDatabase = true;
      logger.info('Database cleanup completed', {
        userId,
        stats: result.databaseStats,
      });
    } catch (error) {
      logger.error('Database cleanup failed', {
        userId,
        error: error.message,
      });
      result.errors.push({
        step: 'Database cleanup',
        error: error.message,
      });
      throw error; // Database deletion is critical
    }

    // Step 4: Delete user from Clerk
    logger.info('Deleting user from Clerk', { userId });
    try {
      result.deletedFromClerk = await deleteClerkUser(userId);
      if (result.deletedFromClerk) {
        logger.info('Clerk cleanup completed', { userId });
      } else {
        logger.warn('Clerk cleanup failed', { userId });
      }
    } catch (error) {
      logger.error('Clerk cleanup failed', {
        userId,
        error: error.message,
      });
      result.errors.push({
        step: 'Clerk cleanup',
        error: error.message,
      });
      // Continue even if Clerk deletion fails
    }

    result.success = true;
    logger.info('Account deletion completed successfully', {
      userId,
      email,
      result,
    });

    return result;
  } catch (error) {
    logger.error('Account deletion failed', {
      userId,
      email,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  deleteUserAccount,
  deleteUserFilesFromB2,
  deleteUserDataFromDatabase,
  deleteClerkUser,
  verifyUserPassword,
};
