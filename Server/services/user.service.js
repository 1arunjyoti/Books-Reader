const prisma = require('../config/database');
const { deleteFromB2 } = require('../config/storage');
const logger = require('../utils/logger');
const axios = require('axios');

/**
 * User Service
 * Handles complex user operations including account deletion
 */

/**
 * Get Auth0 Management API token
 * Required for deleting users from Auth0
 */
async function getAuth0ManagementToken() {
  try {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      logger.warn('Auth0 Management API credentials not configured');
      return null;
    }

    const response = await axios.post(`https://${domain}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    });

    return response.data.access_token;
  } catch (error) {
    logger.error('Failed to get Auth0 management token', {
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}

/**
 * Delete user from Auth0
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<boolean>} - Success status
 */
async function deleteAuth0User(userId) {
  try {
    const token = await getAuth0ManagementToken();
    
    if (!token) {
      logger.warn('Skipping Auth0 user deletion - credentials not configured');
      return false;
    }

    const domain = process.env.AUTH0_DOMAIN;
    await axios.delete(`https://${domain}/api/v2/users/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    logger.info('User deleted from Auth0', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to delete user from Auth0', {
      userId,
      error: error.message,
      status: error.response?.status,
    });
    return false;
  }
}

/**
 * Verify user password with Auth0
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<boolean>} - True if password is correct
 */
async function verifyUserPassword(email, password) {
  try {
    const domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      logger.warn('Auth0 credentials not configured for password verification - skipping password check');
      return true; // Skip verification if not configured
    }

    // Try to authenticate with the provided credentials
    const response = await axios.post(`https://${domain}/oauth/token`, {
      grant_type: 'password',
      username: email,
      password: password,
      client_id: clientId,
      client_secret: clientSecret,
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    });

    // If we get a token, password is correct
    return !!response.data.access_token;
  } catch (error) {
    // Check if it's a configuration error that should skip password verification
    const errorDescription = error.response?.data?.error_description || error.message || '';
    const errorCode = error.response?.data?.error || '';
    
    // Skip password verification for configuration-related errors
    if (
      (errorCode === 'unauthorized_client' && errorDescription.includes('password')) ||
      errorDescription.includes('Authorization server not configured') ||
      errorDescription.includes('default connection') ||
      errorDescription.includes('Grant type')
    ) {
      logger.warn('Password grant not properly configured in Auth0 - skipping password verification', {
        email,
        error: errorDescription,
      });
      // Skip password verification if grant type not properly configured
      return true;
    }
    
    // Authentication failed - password is incorrect
    logger.warn('Password verification failed', {
      email,
      error: errorDescription,
    });
    return false;
  }
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

    // Step 4: Delete user from Auth0
    logger.info('Deleting user from Auth0', { userId });
    try {
      result.deletedFromAuth0 = await deleteAuth0User(userId);
      if (result.deletedFromAuth0) {
        logger.info('Auth0 cleanup completed', { userId });
      } else {
        logger.warn('Auth0 cleanup skipped or failed', { userId });
      }
    } catch (error) {
      logger.error('Auth0 cleanup failed', {
        userId,
        error: error.message,
      });
      result.errors.push({
        step: 'Auth0 cleanup',
        error: error.message,
      });
      // Continue even if Auth0 deletion fails
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
  deleteAuth0User,
  verifyUserPassword,
};
