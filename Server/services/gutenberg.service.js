const axios = require('axios');
const crypto = require('crypto');
const { uploadToB2 } = require('../config/storage');
const prisma = require('../config/database');
const { randomFileName } = require('../utils/helpers');
const logger = require('../utils/logger');
const booksService = require('./books.service');

class GutenbergService {
  /**
   * Import a book from Project Gutenberg
   * @param {string} userId - The ID of the user importing the book
   * @param {Object} bookData - The book data from Gutendex
   * @returns {Promise<Object>} The created book object
   */
  async importBook(userId, bookData) {
    logger.info('Starting Gutenberg book import', { userId, gutenbergId: bookData.id, title: bookData.title });

    try {
      // 1. Validate and fetch authoritative data from Gutendex (prevent SSRF)
      if (!bookData.id || isNaN(bookData.id)) {
        throw new Error('Invalid Gutenberg ID');
      }

      logger.info('Fetching authoritative metadata from Gutendex', { id: bookData.id });
      const gutendexResponse = await axios.get(`https://gutendex.com/books/${bookData.id}`);
      const authoritativeData = gutendexResponse.data;

      // 2. Find the best download URL (EPUB preferred) using authoritative data
      const downloadUrl = this.findBestDownloadUrl(authoritativeData.formats);
      if (!downloadUrl) {
        throw new Error('No suitable download format found (EPUB preferred)');
      }
      
      // Update bookData to use the authoritative data for metadata extraction later
      bookData = authoritativeData;

      // 2. Download the file
      logger.info('Downloading book from Gutenberg', { url: downloadUrl });
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 30000 // 30 seconds timeout
      });
      
      const fileBuffer = Buffer.from(response.data);
      const fileSize = fileBuffer.length;
      const fileType = 'epub'; // We only support EPUB for now from Gutenberg

      // 3. Upload to B2 Storage
      const fileName = `books/${randomFileName()}.epub`;
      const metadata = {
        originalName: `${bookData.title}.epub`,
        uploadedAt: new Date().toISOString(),
        size: fileSize,
        userId
      };

      logger.info('Uploading to B2', { fileName, size: fileSize });
      const uploadResult = await uploadToB2(fileBuffer, fileName, metadata, 'application/epub+zip');

      // 4. Prepare book metadata
      const author = bookData.authors.map(a => a.name).join(', ') || 'Unknown Author';
      const subjects = bookData.subjects || [];
      const bookshelves = bookData.bookshelves || [];
      const genres = [...new Set([...subjects, ...bookshelves])].slice(0, 5); // Limit to 5 genres

      // 5. Create Book record in database
      const book = await prisma.book.create({
        data: {
          id: crypto.randomUUID(), // Generate a unique ID
          title: bookData.title,
          author: author,
          fileName: fileName,
          originalName: `${bookData.title}.epub`,
          fileUrl: uploadResult.fileUrl,
          fileId: uploadResult.fileId,
          fileSize: fileSize,
          userId: userId,
          fileType: fileType,
          language: bookData.languages?.[0] || 'en',
          genre: genres,
          status: 'unread',
          progress: 0,
          totalPages: 0, // Will be updated when opened
          description: `Imported from Project Gutenberg (ID: ${bookData.id})`,
          publicationYear: null, // Gutenberg doesn't always provide this easily
          publisher: 'Project Gutenberg',
          coverUrl: bookData.formats['image/jpeg'] || null // Use Gutenberg cover if available
        }
      });

      // 6. If we have a cover URL, we might want to download and re-upload it to our storage
      // But for now, we'll just use the external URL or let the client handle it.
      // Better approach: Download cover and upload to B2 to ensure persistence and HTTPS
      if (bookData.formats['image/jpeg']) {
        this.processExternalCover(book.id, userId, bookData.formats['image/jpeg']).catch(err => {
          logger.warn('Failed to process external cover', { bookId: book.id, error: err.message });
        });
      }

      logger.info('Gutenberg book imported successfully', { bookId: book.id });
      return book;

    } catch (error) {
      logger.error('Gutenberg import failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Find the preferred download URL from formats
   * @param {Object} formats - formats object from Gutendex
   * @returns {string|null}
   */
  findBestDownloadUrl(formats) {
    // Priority: EPUB 3 -> EPUB -> ZIP
    // Gutendex keys look like 'application/epub+zip'
    
    if (formats['application/epub+zip']) return formats['application/epub+zip'];
    
    // Sometimes it might be under other keys, but Gutendex is usually consistent
    return null;
  }

  /**
   * Download external cover and upload to our storage
   */
  async processExternalCover(bookId, userId, coverUrl) {
    try {
      const response = await axios.get(coverUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      await booksService.uploadCoverImage(
        bookId,
        userId,
        buffer,
        'cover.jpg',
        buffer.length
      );
    } catch (error) {
      logger.error('Error processing external cover', { error: error.message });
    }
  }
}

module.exports = new GutenbergService();
