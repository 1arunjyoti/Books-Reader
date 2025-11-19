const FileType = require('file-type');
const { uploadToB2, generatePresignedUrl, deleteFromB2 } = require('../config/storage');
const prisma = require('../config/database');
const { randomFileName } = require('../utils/helpers');
const logger = require('../utils/logger');
const { sanitizeBookMetadata, sanitizeSearchFilters } = require('../utils/sanitize');
const CoverGenerationService = require('./cover-generation.service');
const uploadService = require('./upload.service');

/**
 * Books Service
 * Handles all business logic related to books management
 */

// Simple in-memory cache for presigned URLs to avoid hammering B2 on list views
const coverUrlCache = new Map();
const DEFAULT_PRESIGNED_TTL_SECONDS = 3600;
const CACHE_SAFETY_WINDOW_MS = 60 * 1000; // refresh 1 min before expiry
const MAX_CACHE_SIZE = 500;

function pruneCoverCache() {
  if (coverUrlCache.size <= MAX_CACHE_SIZE) {
    return;
  }
  const entries = Array.from(coverUrlCache.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const excess = coverUrlCache.size - MAX_CACHE_SIZE;
  for (let i = 0; i < excess; i++) {
    coverUrlCache.delete(entries[i][0]);
  }
}

async function getCachedPresignedUrl(objectKey, ttlSeconds = DEFAULT_PRESIGNED_TTL_SECONDS) {
  const cached = coverUrlCache.get(objectKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const presignedUrl = await generatePresignedUrl(objectKey, ttlSeconds);
  const rawExpiry = now + (ttlSeconds * 1000) - CACHE_SAFETY_WINDOW_MS;
  const expiresAt = rawExpiry > now ? rawExpiry : now + 1000; // keep cache for at least 1s
  coverUrlCache.set(objectKey, { url: presignedUrl, expiresAt });
  pruneCoverCache();
  return presignedUrl;
}

class BooksService {
  constructor() {
    // Initialize cover generation service
    this.coverService = new CoverGenerationService(uploadService);
  }
  
  /**
   * Build query filters for books listing
   * @param {Object} filters - Filter parameters
   * @returns {Object} Prisma where clause
   */
  buildBooksFilter(filters) {
    // Sanitize all filter inputs first
    const sanitized = sanitizeSearchFilters(filters);
    
    const {
      userId,
      search = '',
      status = 'all',
      genre = '',
      format = '',
      language = '',
      dateFrom = '',
      dateTo = ''
    } = { ...filters, ...sanitized };

    const where = { userId };

    // Search filter (title or author)
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          author: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Genre filter (array contains)
    if (genre) {
      const genres = genre.split(',').filter(g => g.trim());
      if (genres.length > 0) {
        where.genre = {
          hasSome: genres
        };
      }
    }

    // Format filter (fileType)
    if (format) {
      const formats = format.split(',').filter(f => f.trim());
      if (formats.length > 0) {
        // If multiple formats, use OR condition
        if (formats.length === 1) {
          where.fileType = {
            equals: formats[0],
            mode: 'insensitive'
          };
        } else {
          where.fileType = {
            in: formats
          };
        }
      }
    }

    // Language filter
    if (language) {
      where.language = language;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.uploadedAt = {};
      if (dateFrom) {
        where.uploadedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.uploadedAt.lt = endDate;
      }
    }

    return where;
  }

  /**
   * Build orderBy clause for books listing
   * @param {string} sortBy - Field to sort by
   * @param {string} sortOrder - Sort order (asc/desc)
   * @returns {Object} Prisma orderBy clause
   */
  buildBooksOrderBy(sortBy = 'uploadedAt', sortOrder = 'desc') {
    const validSortFields = ['uploadedAt', 'title', 'author', 'progress', 'lastReadAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'uploadedAt';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    
    return { [sortField]: order };
  }

  /**
   * Get all books for a user with filters
   * @param {string} userId - User ID
   * @param {Object} queryParams - Query parameters for filtering and sorting
   * @returns {Promise<Array>} List of books
   */
  async getAllBooks(userId, queryParams) {
    const where = this.buildBooksFilter({ userId, ...queryParams });
    const orderBy = this.buildBooksOrderBy(queryParams.sortBy, queryParams.sortOrder);

    // Extract pagination parameters with defaults
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit) || 20));
    const skip = (page - 1) * limit;

    logger.debug('Fetching books', { userId, filters: where, page, limit });

    const books = await prisma.book.findMany({
      where,
      orderBy,
      skip,
      take: limit
    });

    // Resolve presigned cover URLs (if present). Return both the stored key (coverKey)
    // and the presigned URL (coverUrl) in the response so the client can use either.
    const booksWithCovers = await Promise.all(books.map(async (b) => {
      const book = { ...b };
      if (book.coverUrl) {
        // store original key under coverKey
        book.coverKey = book.coverUrl;
        try {
          const presigned = await getCachedPresignedUrl(book.coverKey);
          book.coverUrl = presigned;
        } catch (err) {
          logger.warn('Failed to generate presigned cover URL', { bookId: book.id, error: err.message });
          // leave coverUrl as the key if presigning fails
          book.coverUrl = book.coverKey;
        }
      } else {
        book.coverKey = null;
        book.coverUrl = null;
      }
      return book;
    }));

    logger.info('Books fetched successfully', { userId, count: booksWithCovers.length });
    return booksWithCovers;
  }

  /**
   * Get a single book by ID
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Book object
   * @throws {Error} If book not found or doesn't belong to user
   */
  async getBookById(bookId, userId) {
    const book = await prisma.book.findFirst({
      where: { 
        id: bookId,
        userId
      }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    // If a cover key exists, expose both coverKey and a presigned coverUrl in the response
    if (book.coverUrl) {
      const coverKey = book.coverUrl;
      try {
        const presigned = await getCachedPresignedUrl(coverKey);
        book.coverKey = coverKey;
        book.coverUrl = presigned;
      } catch (err) {
        logger.warn('Failed to generate presigned cover URL for single book', { bookId: book.id, error: err.message });
        book.coverKey = coverKey;
        // leave book.coverUrl as the key
      }
    } else {
      book.coverKey = null;
      book.coverUrl = null;
    }

    logger.debug('Book fetched by ID', { bookId, userId });
    return book;
  }

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
   * Generate presigned URL for book file
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @param {number} expiresIn - URL expiration time in seconds (default 3600)
   * @returns {Promise<Object>} Presigned URL data
   */
  async generateBookPresignedUrl(bookId, userId, expiresIn = 3600) {
    // Verify book ownership
    const book = await this.verifyBookOwnership(bookId, userId);

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(book.fileUrl, expiresIn);

    logger.info('Presigned URL generated', { bookId, userId, expiresIn });

    return {
      presignedUrl,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
    };
  }

  /**
   * Update book metadata
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated book object
   */
  async updateBook(bookId, userId, updateData) {
    // Verify book ownership
    const existingBook = await this.verifyBookOwnership(bookId, userId);

    // Sanitize all input data BEFORE processing
    const sanitizedData = sanitizeBookMetadata(updateData);

    // Prepare update data
    const data = {};

    // Only include fields that are provided and sanitized
    const allowedFields = [
      'title', 'author', 'status', 'progress', 'currentPage', 
      'totalPages', 'description', 'genre', 'publicationYear', 
      'isbn', 'publisher', 'language'
    ];

    allowedFields.forEach(field => {
      // Include field if it's explicitly set (including null values for clearing)
      if (field in sanitizedData) {
        data[field] = sanitizedData[field];
      }
    });

    // Validate required fields
    if (data.title === '') {
      throw new Error('Book title cannot be empty');
    }

    // Check if book is being marked as finished
    const wasNotFinished = existingBook.status !== 'finished';
    const isNowFinished = sanitizedData.status === 'finished';

    // Update lastReadAt if status changed to reading
    if (sanitizedData.status === 'reading') {
      data.lastReadAt = new Date();
    }

    // Update book
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data
    });

    logger.info('Book updated', { bookId, userId, updatedFields: Object.keys(data) });

    // If book was just marked as finished, update books goals
    if (wasNotFinished && isNowFinished) {
      // Import analytics service and update books goals
      const analyticsService = require('./analytics.service');
      await analyticsService.updateBooksGoal(userId, bookId);
    }

    return updatedBook;
  }

  /**
   * Delete a book and all related data
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async deleteBook(bookId, userId) {
    // Verify book ownership
    const book = await this.verifyBookOwnership(bookId, userId);

    // Delete associated files from B2 storage
    try {
      // Delete main book file
      if (book.fileUrl) {
        await deleteFromB2(book.fileUrl);
        logger.info('Book file deleted from B2', { bookId, fileUrl: book.fileUrl });
      }

      // Delete cover image if it exists
      if (book.coverUrl) {
        await deleteFromB2(book.coverUrl);
        logger.info('Cover image deleted from B2', { bookId, coverUrl: book.coverUrl });
      }
    } catch (err) {
      logger.warn('Error deleting files from B2', { bookId, error: err.message });
      // Continue with database deletion even if B2 deletion fails
    }

    // Delete all related data from database
    // This ensures complete cleanup since Prisma schema doesn't have cascade rules
    try {
      // Delete all highlights for this book
      const highlightsDeleted = await prisma.highlight.deleteMany({
        where: { bookId, userId }
      });
      logger.info('Highlights deleted', { bookId, count: highlightsDeleted.count });

      // Delete all bookmarks for this book
      const bookmarksDeleted = await prisma.bookmark.deleteMany({
        where: { bookId, userId }
      });
      logger.info('Bookmarks deleted', { bookId, count: bookmarksDeleted.count });

      // Delete all annotations for this book
      const annotationsDeleted = await prisma.annotation.deleteMany({
        where: { bookId, userId }
      });
      logger.info('Annotations deleted', { bookId, count: annotationsDeleted.count });

      // Delete all reading sessions for this book
      const sessionsDeleted = await prisma.readingSession.deleteMany({
        where: { bookId, userId }
      });
      logger.info('Reading sessions deleted', { bookId, count: sessionsDeleted.count });

      // Remove book from all collections
      const collections = await prisma.collection.findMany({
        where: {
          userId,
          bookIds: { has: bookId }
        }
      });

      for (const collection of collections) {
        await prisma.collection.update({
          where: { id: collection.id },
          data: {
            bookIds: collection.bookIds.filter(id => id !== bookId)
          }
        });
      }
      logger.info('Book removed from collections', { bookId, collectionsCount: collections.length });

    } catch (err) {
      logger.error('Error deleting related data', { bookId, error: err.message });
      throw new Error('Failed to delete book related data');
    }

    // Delete book from database
    await prisma.book.delete({
      where: { id: bookId }
    });

    logger.info('Book and all related data deleted successfully', { bookId, userId });
  }

  /**
   * Validate cover image file
   * @param {Buffer} buffer - File buffer
   * @param {number} size - File size
   * @returns {Promise<Object>} File type info
   * @throws {Error} If validation fails
   */
  async validateCoverImage(buffer, size) {
    // Validate file type
    const fileType = await FileType.fromBuffer(buffer);
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!fileType || !allowedTypes.includes(fileType.mime)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    }

    // Validate file size (5MB limit)
    if (size > 5 * 1024 * 1024) {
      throw new Error('Cover image size exceeds 5MB limit');
    }

    return fileType;
  }

  /**
   * Upload cover image for a book
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @param {Buffer} buffer - Image buffer
   * @param {string} originalName - Original filename
   * @param {number} size - File size
   * @returns {Promise<Object>} Updated book with cover URL
   */
  async uploadCoverImage(bookId, userId, buffer, originalName, size) {
    // Verify book ownership
    await this.verifyBookOwnership(bookId, userId);

    // Validate cover image
    const fileType = await this.validateCoverImage(buffer, size);

    // Generate filename for cover image
    const coverFileName = `covers/${randomFileName()}.${fileType.ext}`;

    // Upload cover to B2
    const metadata = {
      originalName,
      uploadedAt: new Date().toISOString(),
      size,
      userId,
      bookId
    };

    logger.info('Uploading cover image', { bookId, userId, size });
    const result = await uploadToB2(buffer, coverFileName, metadata, fileType.mime);

    // Update book with cover URL
    const updatedBook = await prisma.book.update({
      where: { id: bookId },
      data: { coverUrl: result.fileUrl }
    });

    logger.info('Cover image uploaded successfully', { bookId, coverUrl: result.fileUrl });

    return {
      success: true,
      book: updatedBook,
      coverUrl: result.fileUrl
    };
  }

  /**
   * Generate cover for a book from its original file
   * @param {string} bookId - Book ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Result with status
   */
  async generateBookCover(bookId, userId) {
    // Verify book ownership and get book details
    const book = await this.verifyBookOwnership(bookId, userId);

    // Check if book already has a cover
    if (book.coverUrl) {
      logger.info('Book already has a cover', { bookId, coverUrl: book.coverUrl });
      return {
        success: true,
        message: 'Book already has a cover. Use POST /:id/cover to replace it.',
        coverUrl: book.coverUrl,
        bookId
      };
    }

    // Validate file size to prevent memory issues
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (book.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large for cover generation (${(book.fileSize / 1024 / 1024).toFixed(2)}MB). Maximum size is 100MB.`);
    }

    // Get the original file from B2 to generate cover
    logger.info('Fetching original file for cover generation', { 
      bookId, 
      fileName: book.fileName,
      fileSize: book.fileSize
    });

    // Generate presigned URL to download the file
    const fileUrl = await generatePresignedUrl(book.fileName, 3600);
    
    // Download file buffer with size limit
    const axios = require('axios');
    const response = await axios.get(fileUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000,
      maxContentLength: MAX_FILE_SIZE,
      maxBodyLength: MAX_FILE_SIZE
    });
    const fileBuffer = Buffer.from(response.data);

    // Schedule background cover generation
    logger.info('Scheduling cover generation', { bookId, fileType: book.fileType });
    
    // Wrap in setImmediate and add error handling
    setImmediate(() => {
      // Add try-catch to prevent uncaught errors
      try {
        this.coverService.generateCoverInBackground(
          bookId,
          fileBuffer,
          book.fileType,
          book.originalName,
          userId
        );
      } catch (err) {
        logger.error('Failed to schedule cover generation', {
          bookId,
          error: err.message,
          stack: err.stack
        });
      }
    });

    return {
      success: true,
      message: 'Cover generation started in background. Check back shortly.',
      bookId,
      estimatedTime: '30-60 seconds'
    };
  }
}

module.exports = new BooksService();
