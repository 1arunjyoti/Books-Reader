const axios = require('axios');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const { uploadToB2 } = require('../config/storage');
const { extractPdfMetadata } = require('../utils/pdfUtils');
const { extractEpubMetadata, isValidEpub } = require('../utils/epubUtils');
const { extractTxtMetadata, isValidTxt } = require('../utils/txtUtils');
const prisma = require('../config/database');
const { randomFileName } = require('../utils/helpers');
const logger = require('../utils/logger');
const CoverGenerationService = require('./cover-generation.service');

/**
 * Upload Service
 * Handles all business logic related to file uploads
 */

class UploadService {
  constructor() {
    // Initialize cover generation service
    this.coverService = new CoverGenerationService(this);
  }
  /**
   * Validate file type and size
   * @param {Buffer} buffer - File buffer
   * @param {string} fileType - File type (pdf, epub, txt)
   * @param {string} originalName - Original filename
   * @returns {Promise<void>}
   * @throws {Error} If validation fails
   */
  async validateFile(buffer, fileType, originalName) {
    // Validate file size
    if (buffer.length > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }

    // Validate file type based on type
    if (fileType === 'pdf') {
      const fileTypeCheck = await FileType.fromBuffer(buffer);
      if (!fileTypeCheck || fileTypeCheck.mime !== 'application/pdf') {
        throw new Error('Invalid file type. Only PDF files are allowed.');
      }
    } else if (fileType === 'epub') {
      if (!isValidEpub(buffer)) {
        throw new Error('Invalid EPUB file.');
      }
    } else if (fileType === 'txt') {
      if (!isValidTxt(buffer)) {
        throw new Error('Invalid text file.');
      }
    }

    logger.debug('File validated successfully', { fileType, size: buffer.length });
  }

  /**
   * Determine file type from filename extension
   * @param {string} filename - Original filename
   * @returns {string} File type (pdf, epub, txt)
   */
  determineFileType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    
    if (extension === 'epub') {
      return 'epub';
    } else if (extension === 'txt') {
      return 'txt';
    }
    
    return 'pdf'; // default
  }

  /**
   * Extract metadata from file based on type
   * @param {Buffer} buffer - File buffer
   * @param {string} fileType - File type
   * @param {string} originalName - Original filename
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Extracted metadata
   */
  async extractMetadata(buffer, fileType, originalName, userId) {
    logger.info(`Extracting ${fileType.toUpperCase()} metadata`, { fileType, userId });
    
    let extractedMetadata;
    
    if (fileType === 'pdf') {
      extractedMetadata = await extractPdfMetadata(buffer);
    } else if (fileType === 'epub') {
      extractedMetadata = await extractEpubMetadata(buffer);
    } else if (fileType === 'txt') {
      extractedMetadata = await extractTxtMetadata(buffer, originalName);
    }
    
    logger.debug('Metadata extracted', { 
      title: extractedMetadata?.title, 
      author: extractedMetadata?.author,
      fileType 
    });
    
    return extractedMetadata;
  }

  /**
   * Upload file to B2 storage
   * @param {Buffer} buffer - File buffer
   * @param {string} fileName - Generated filename
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result with fileUrl and fileId
   */
  async uploadFileToStorage(buffer, fileName, metadata, contentType) {
    logger.debug('Uploading to B2 storage', { fileName, size: buffer.length, contentType });
    // Pass contentType through to underlying storage adapter if supported
    const result = await uploadToB2(buffer, fileName, metadata, contentType);
    logger.info('File uploaded to B2 successfully', { fileName, fileId: result.fileId });
    return result;
  }

  /**
   * Save book to database
   * @param {Object} bookData - Book data to save
   * @returns {Promise<Object>} Created book record
   */
  async saveBookToDatabase(bookData) {
    logger.debug('Saving book to database', { title: bookData.title });
    
    const book = await prisma.book.create({
      data: bookData
    });
    
    logger.info('Book saved to database', { bookId: book.id, title: book.title });
    return book;
  }

  /**
   * Process and upload a file (main business logic)
   * @param {Buffer} buffer - File buffer
   * @param {string} originalName - Original filename
   * @param {number} size - File size
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Upload result with book data
   */
  async processFileUpload(buffer, originalName, size, userId) {
    // Determine file type
    const fileType = this.determineFileType(originalName);
    
    // Validate file
    await this.validateFile(buffer, fileType, originalName);

    // Check user storage limit
    const STORAGE_LIMIT = BigInt(5 * 1024 * 1024 * 1024); // 5 GB
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usedStorage: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const currentStorage = user.usedStorage || BigInt(0);
    const newFileSize = BigInt(size);

    if (currentStorage + newFileSize > STORAGE_LIMIT) {
      throw new Error('Storage limit exceeded. You have reached the 5GB limit.');
    }
    
    // Generate unique filename
    const extension = originalName.toLowerCase().split('.').pop();
    const fileName = `${randomFileName()}.${extension}`;
    
    // Extract metadata
    const extractedMetadata = await this.extractMetadata(buffer, fileType, originalName, userId);
    
    // Prepare upload metadata
    const uploadMetadata = {
      originalName,
      uploadedAt: new Date().toISOString(),
      size,
      userId,
      fileType,
    };
    
    // Upload to B2
    const uploadResult = await this.uploadFileToStorage(buffer, fileName, uploadMetadata);
    
    // Try to generate cover image synchronously for small files
    // For large files, schedule background generation
    let coverUploadResult = null;
    const shouldGenerateCover = ['pdf', 'epub', 'txt'].includes(fileType);
    
    if (shouldGenerateCover) {
      try {
        // Try sync generation for smaller files
        coverUploadResult = await this.coverService.tryGenerateCoverSync(
          buffer, 
          fileType, 
          originalName, 
          userId
        );
      } catch (err) {
        logger.warn('Sync cover generation failed', {
          error: err.message,
          originalName,
          userId,
        });
      }
    }

    // Determine title and author
    const bookTitle = extractedMetadata.title || originalName.replace(/\.(pdf|epub|txt)$/i, '');
    const bookAuthor = extractedMetadata.author || null;
    
    // Prepare book data
    const bookData = {
      id: uuidv4(),
      title: bookTitle,
      author: bookAuthor,
      fileName,
      originalName,
      fileUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      coverUrl: coverUploadResult ? coverUploadResult.fileName : null,
      fileSize: size,
      fileType,
      userId,
      totalPages: extractedMetadata.totalPages || extractedMetadata.totalSections || 0,
      publicationYear: extractedMetadata.publicationYear || 
        (extractedMetadata.publicationDate ? parseInt(extractedMetadata.publicationDate) : null),
      language: extractedMetadata.language,
      publisher: extractedMetadata.publisher,
      description: extractedMetadata.description,
      isbn: extractedMetadata.isbn,
      pdfMetadata: fileType === 'pdf' ? extractedMetadata.rawMetadata : 
                   JSON.stringify(extractedMetadata),
    };
    
    // Save to database and update user storage in a transaction
    const book = await prisma.$transaction(async (tx) => {
      // Create book
      const newBook = await tx.book.create({
        data: bookData
      });

      // Update user used storage
      await tx.user.update({
        where: { id: userId },
        data: {
          usedStorage: {
            increment: size
          }
        }
      });

      return newBook;
    });
    
    logger.info('Book saved and storage updated', { bookId: book.id, title: book.title, userId });
    
    // If cover wasn't generated (large file), schedule background generation
    if (shouldGenerateCover && !coverUploadResult) {
      logger.info('Scheduling background cover generation', { 
        bookId: book.id, 
        originalName,
        fileSize: size
      });
      
      // Don't await - let it run in background
      // Use setImmediate to avoid blocking the event loop
      setImmediate(() => {
        // Wrap in try-catch to prevent uncaught errors from crashing server
        try {
          this.coverService.generateCoverInBackground(
            book.id,
            buffer,
            fileType,
            originalName,
            userId
          );
        } catch (err) {
          logger.error('Failed to schedule background cover generation', {
            bookId: book.id,
            error: err.message
          });
        }
      });
    }
    
    return {
      success: true,
      book,
      fileName,
      fileUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      metadata: uploadMetadata,
      coverGenerating: shouldGenerateCover && !coverUploadResult // Indicate if cover is being generated
    };
  }

  /**
   * Download file from URL
   * @param {string} url - File URL
   * @returns {Promise<Object>} Downloaded file data (buffer, originalName)
   */
  async downloadFileFromUrl(url) {
    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.');
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
    
    logger.info('Downloading file from URL', { url });
    
    try {
      // Download file with timeout and size limit
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer',
        timeout: 60000, // 60 second timeout
        maxContentLength: 100 * 1024 * 1024, // 100MB limit
        maxBodyLength: 100 * 1024 * 1024,
        headers: {
          'User-Agent': 'BooksReader/1.0'
        }
      });
      
      const buffer = Buffer.from(response.data);
      
      // Try to extract original filename from URL or Content-Disposition header
      let originalName = 'document.pdf';
      const contentDisposition = response.headers['content-disposition'];
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          originalName = match[1];
        }
      } else {
        const urlPath = parsedUrl.pathname.split('/').pop();
        if (urlPath && /\.(pdf|epub|txt)$/i.test(urlPath)) {
          originalName = urlPath;
        }
      }
      
      logger.info('File downloaded successfully', { 
        originalName, 
        size: buffer.length 
      });
      
      return { buffer, originalName };
      
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - file download took too long');
      }
      
      if (error.code === 'ERR_BAD_REQUEST' || error.response?.status === 404) {
        throw new Error('Could not download file from URL. Please check the URL and try again.');
      }
      
      throw error;
    }
  }

  /**
   * Process and upload a file from URL
   * @param {string} url - File URL
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Upload result with book data
   */
  async processUrlUpload(url, userId) {
    // Download file
    const { buffer, originalName } = await this.downloadFileFromUrl(url);
    
    // Validate it's a PDF (for URL uploads, we only support PDF for now)
    const fileType = await FileType.fromBuffer(buffer);
    if (!fileType || fileType.mime !== 'application/pdf') {
      throw new Error('Invalid file type. Only PDF files are allowed.');
    }
    
    // Process as normal file upload
    const result = await this.processFileUpload(buffer, originalName, buffer.length, userId);
    
    // Add source URL to metadata
    result.metadata.sourceUrl = url;
    
    return result;
  }
}

module.exports = new UploadService();
