const prisma = require('../config/database');
const logger = require('../utils/logger');
const { generatePresignedUrl } = require('../config/storage');
const { randomUUID } = require('crypto');

/**
 * Collections Service
 * Handles all business logic related to collections management
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
  
  // Only prune excess entries (more efficient than sorting entire cache)
  const excess = coverUrlCache.size - MAX_CACHE_SIZE;
  const entriesToRemove = [];
  
  // Find the oldest entries to remove
  if (excess > 0) {
    const entries = Array.from(coverUrlCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    for (let i = 0; i < excess && i < entries.length; i++) {
      entriesToRemove.push(entries[i][0]);
    }
    
    // Remove the oldest entries
    entriesToRemove.forEach(key => coverUrlCache.delete(key));
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
  
  // Only prune when cache exceeds limit
  if (coverUrlCache.size > MAX_CACHE_SIZE) {
    pruneCoverCache();
  }
  
  return presignedUrl;
}

class CollectionsService {
  /**
   * Get all collections for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} List of collections
   */
  async getAllCollections(userId) {
    const collections = await prisma.collection.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    logger.debug('Collections fetched', { userId, count: collections.length });
    return collections;
  }

  /**
   * Check if collection name exists for user
   * @param {string} userId - User ID
   * @param {string} name - Collection name
   * @param {string} excludeId - Collection ID to exclude from check (for updates)
   * @returns {Promise<boolean>} True if name exists
   */
  async nameExists(userId, name, excludeId = null) {
    const where = {
      userId,
      name: name.trim()
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await prisma.collection.findFirst({ where });
    return !!existing;
  }

  /**
   * Create a new collection
   * @param {string} userId - User ID
   * @param {Object} collectionData - Collection data
   * @returns {Promise<Object>} Created collection
   * @throws {Error} If validation fails
   */
  async createCollection(userId, collectionData) {
    const { name, description, color, icon } = collectionData;

    // Validate name
    if (!name || name.trim() === '') {
      throw new Error('Collection name is required');
    }

    // Check if name already exists
    const exists = await this.nameExists(userId, name);
    if (exists) {
      throw new Error('Collection with this name already exists');
    }

    const collection = await prisma.collection.create({
      data: {
        id: randomUUID(),
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        icon: icon || 'folder'
      }
    });

    logger.info('Collection created', { collectionId: collection.id, userId, name });
    return collection;
  }

  /**
   * Verify collection ownership
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Collection object
   * @throws {Error} If collection not found or doesn't belong to user
   */
  async verifyOwnership(collectionId, userId) {
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    });

    if (!collection || collection.userId !== userId) {
      throw new Error('Collection not found');
    }

    return collection;
  }

  /**
   * Update a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated collection
   */
  async updateCollection(collectionId, userId, updateData) {
    // Verify ownership
    const collection = await this.verifyOwnership(collectionId, userId);

    const { name, description, color, icon } = updateData;

    // Check if new name conflicts with existing collection
    if (name && name !== collection.name) {
      const exists = await this.nameExists(userId, name, collectionId);
      if (exists) {
        throw new Error('Collection with this name already exists');
      }
    }

    // Prepare update data
    const data = {};
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (color) data.color = color;
    if (icon) data.icon = icon;

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data
    });

    logger.info('Collection updated', { 
      collectionId, 
      userId, 
      updatedFields: Object.keys(data) 
    });

    return updated;
  }

  /**
   * Delete a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   * @throws {Error} If trying to delete default collection
   */
  async deleteCollection(collectionId, userId) {
    // Verify ownership
    const collection = await this.verifyOwnership(collectionId, userId);

    // Prevent deletion of default collection
    if (collection.isDefault) {
      throw new Error('Cannot delete default collection');
    }

    await prisma.collection.delete({
      where: { id: collectionId }
    });

    logger.info('Collection deleted', { collectionId, userId });
  }

  /**
   * Verify books belong to user
   * @param {Array} bookIds - Book IDs
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Valid book IDs
   * @throws {Error} If some books don't belong to user
   */
  async verifyBooksOwnership(bookIds, userId) {
    const books = await prisma.book.findMany({
      where: {
        id: { in: bookIds },
        userId
      },
      select: { id: true }
    });

    if (books.length !== bookIds.length) {
      throw new Error('Some books not found or do not belong to you');
    }

    return books.map(b => b.id);
  }

  /**
   * Add books to a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @param {Array} bookIds - Book IDs to add
   * @returns {Promise<Object>} Updated collection
   */
  async addBooksToCollection(collectionId, userId, bookIds) {
    // Validate input
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      throw new Error('bookIds must be a non-empty array');
    }

    // Verify collection ownership
    const collection = await this.verifyOwnership(collectionId, userId);

    // Verify all books belong to user
    await this.verifyBooksOwnership(bookIds, userId);

    // Add unique book IDs to collection
    const currentBookIds = collection.bookIds || [];
    const newBookIds = [...new Set([...currentBookIds, ...bookIds])];

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        bookIds: newBookIds
      }
    });

    logger.info('Books added to collection', { 
      collectionId, 
      userId, 
      addedCount: bookIds.length,
      totalCount: newBookIds.length
    });

    return updated;
  }

  /**
   * Remove books from a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @param {Array} bookIds - Book IDs to remove
   * @returns {Promise<Object>} Updated collection
   */
  async removeBooksFromCollection(collectionId, userId, bookIds) {
    // Validate input
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      throw new Error('bookIds must be a non-empty array');
    }

    // Verify collection ownership
    const collection = await this.verifyOwnership(collectionId, userId);

    // Remove book IDs from collection
    const currentBookIds = collection.bookIds || [];
    const newBookIds = currentBookIds.filter(bookId => !bookIds.includes(bookId));

    const updated = await prisma.collection.update({
      where: { id: collectionId },
      data: {
        bookIds: newBookIds
      }
    });

    logger.info('Books removed from collection', { 
      collectionId, 
      userId, 
      removedCount: bookIds.length,
      remainingCount: newBookIds.length
    });

    return updated;
  }

  /**
   * Get books in a collection
   * @param {string} collectionId - Collection ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Collection with books
   */
  async getCollectionBooks(collectionId, userId) {
    // Verify collection ownership
    const collection = await this.verifyOwnership(collectionId, userId);

    // Get books in collection
    const books = await prisma.book.findMany({
      where: {
        id: { in: collection.bookIds || [] },
        userId
      },
      orderBy: { uploadedAt: 'desc' }
    });

    // Resolve presigned cover URLs (if present)
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

    logger.debug('Collection books fetched', { 
      collectionId, 
      userId, 
      count: booksWithCovers.length 
    });

    return { collection, books: booksWithCovers };
  }
}

module.exports = new CollectionsService();
