const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const { execFile } = require('child_process');
const execFileAsync = util.promisify(execFile);
const sharp = require('sharp');
const FileType = require('file-type');
const { randomFileName } = require('../utils/helpers');
const logger = require('../utils/logger');
const { 
  validatePythonExecutable, 
  validateScriptPath, 
  sanitizeCommandArgs,
  getSafeExecutionEnvironment 
} = require('../utils/commandSecurity');
const prisma = require('../config/database');

/**
 * Cover Generation Service
 * Handles asynchronous cover image generation for books
 */
class CoverGenerationService {
  constructor(uploadService) {
    this.uploadService = uploadService;
    this.processingQueue = new Map(); // Track in-progress jobs
    this.MAX_CONCURRENT_JOBS = 5; // Limit concurrent cover generation jobs
  }

  /**
   * Generate cover image from file buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} fileType - File type (pdf, epub, txt)
   * @param {string} originalName - Original filename
   * @returns {Promise<Buffer>} Generated cover image buffer
   */
  async generateCoverImage(buffer, fileType, originalName) {
    // Validate inputs
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided for cover generation');
    }
    if (!fileType || !['pdf', 'epub', 'txt'].includes(fileType)) {
      throw new Error(`Unsupported file type for cover generation: ${fileType}`);
    }
    
    const extension = originalName.toLowerCase().split('.').pop();
    
    const scriptPath = path.join(__dirname, '..', 'Cover_Image_Generator', 'Cover_Image_extractor.py');
    const tmpDir = os.tmpdir();
    const tmpExt = extension || (fileType === 'pdf' ? 'pdf' : fileType);
    const tmpFilePath = path.join(tmpDir, `${randomFileName()}.${tmpExt}`);
    
    try {
      // Write file to temp location
      await fs.promises.writeFile(tmpFilePath, buffer);

      // SECURITY: Validate Python executable and script path
      const pythonExecRaw = process.env.COVER_PYTHON_PATH || 'python';
      const pythonExec = await validatePythonExecutable(pythonExecRaw);
      
      // Validate script path
      const allowedScriptDir = path.join(__dirname, '..', 'Cover_Image_Generator');
      const validatedScriptPath = await validateScriptPath(scriptPath, allowedScriptDir);
      
      logger.debug('Generating cover image', { 
        pythonExec, 
        scriptPath: validatedScriptPath, 
        tmpFilePath,
        fileType 
      });
      
      // SECURITY: Sanitize arguments
      const args = sanitizeCommandArgs([validatedScriptPath, tmpFilePath, '--type', fileType]);
      const safeEnv = getSafeExecutionEnvironment();
      
      // Execute Python script with timeout
      let stdout = '';
      const result = await execFileAsync(
        pythonExec, 
        args, 
        { 
          timeout: 30000, // 30 second timeout
          env: safeEnv,
          maxBuffer: 10 * 1024 * 1024
        }
      );
      stdout = result.stdout || '';

      // Find generated image path from stdout
      let tmpPngPath = null;
      if (stdout) {
        const regex = /([A-Za-z]:\\[^\s]*?\.(?:png|jpe?g|webp|bmp|tiff?))|((?:\/|\.\/)[^\s]*?\.(?:png|jpe?g|webp|bmp|tiff?))|([^\s]+?\.(?:png|jpe?g|webp|bmp|tiff?))/ig;
        const matches = stdout.match(regex);
        if (matches && matches.length > 0) {
          tmpPngPath = matches[matches.length - 1].trim();
          if (!path.isAbsolute(tmpPngPath)) {
            tmpPngPath = path.join(path.dirname(tmpFilePath), tmpPngPath);
          }
        }
      }

      // Fallback: assume PNG next to temp file
      if (!tmpPngPath) tmpPngPath = tmpFilePath.replace(new RegExp(`\.${tmpExt}$`, 'i'), '.png');

      // Read generated image
      const producedBuffer = await fs.promises.readFile(tmpPngPath);

      // Cleanup temp files immediately after reading
      await fs.promises.unlink(tmpFilePath).catch(() => {});
      await fs.promises.unlink(tmpPngPath).catch(() => {});
      await fs.promises.unlink(tmpPngPath).catch(() => {});

      return producedBuffer;
    } catch (error) {
      // Cleanup on error - cleanup both original and potential output file
      await fs.promises.unlink(tmpFilePath).catch(() => {});
      const tmpPngPath = tmpFilePath.replace(new RegExp(`\.${tmpExt}$`, 'i'), '.png');
      await fs.promises.unlink(tmpPngPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Process and upload cover images (original + thumbnail)
   * @param {Buffer} coverBuffer - Raw cover image buffer
   * @param {string} originalName - Original book filename
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Upload result with cover URLs
   */
  async processAndUploadCover(coverBuffer, originalName, userId) {
    // Detect image type
    let ft = await FileType.fromBuffer(coverBuffer).catch(() => null);
    if (!ft) {
      ft = { ext: 'png', mime: 'image/png' };
    }

    // Upload original cover
    const originalFileName = `covers/originals/${randomFileName()}.${ft.ext}`;
    const originalUploadResult = await this.uploadService.uploadFileToStorage(
      coverBuffer, 
      originalFileName, 
      {
        originalName: `${originalName}-cover.${ft.ext}`,
        uploadedAt: new Date().toISOString(),
        userId,
      }, 
      ft.mime
    );

    // Generate and upload thumbnail (300x450 WEBP)
    const thumbBuffer = await sharp(coverBuffer)
      .resize(300, 450, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbFileName = `covers/thumbs/${randomFileName()}.webp`;
    const thumbUploadResult = await this.uploadService.uploadFileToStorage(
      thumbBuffer, 
      thumbFileName, 
      {
        originalName: `${originalName}-thumb.webp`,
        uploadedAt: new Date().toISOString(),
        userId,
      }, 
      'image/webp'
    );

    return {
      original: originalUploadResult,
      thumbnail: thumbUploadResult
    };
  }

  /**
   * Generate cover in background and update book record
   * @param {string} bookId - Book ID to update
   * @param {Buffer} fileBuffer - Original file buffer
   * @param {string} fileType - File type
   * @param {string} originalName - Original filename
   * @param {string} userId - User ID
   */
  async generateCoverInBackground(bookId, fileBuffer, fileType, originalName, userId) {
    // Check if already processing
    if (this.processingQueue.has(bookId)) {
      logger.debug('Cover generation already in progress', { bookId });
      return;
    }

    // Check concurrent job limit to prevent resource exhaustion
    if (this.processingQueue.size >= this.MAX_CONCURRENT_JOBS) {
      logger.warn('Max concurrent cover generation jobs reached, deferring', { 
        bookId, 
        currentJobs: this.processingQueue.size,
        maxJobs: this.MAX_CONCURRENT_JOBS
      });
      // Defer this job - could implement a proper queue here
      setTimeout(() => {
        this.generateCoverInBackground(bookId, fileBuffer, fileType, originalName, userId);
      }, 5000); // Retry in 5 seconds
      return;
    }

    this.processingQueue.set(bookId, { startTime: Date.now(), originalName });

    logger.info('Starting background cover generation', { 
      bookId, 
      originalName,
      bufferSize: fileBuffer.length,
      queueSize: this.processingQueue.size
    });

    // Warn if buffer is very large (potential memory issue)
    if (fileBuffer.length > 50 * 1024 * 1024) {
      logger.warn('Processing very large file for cover generation', {
        bookId,
        size: `${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`
      });
    }

    try {
      // Generate cover image
      const coverBuffer = await this.generateCoverImage(fileBuffer, fileType, originalName);
      
      // Process and upload covers
      const coverResult = await this.processAndUploadCover(coverBuffer, originalName, userId);
      
      // Update book record with cover URL
      await prisma.book.update({
        where: { id: bookId },
        data: {
          coverUrl: coverResult.thumbnail.fileName,
          updatedAt: new Date()
        }
      });

      logger.info('Background cover generation completed', { 
        bookId, 
        coverUrl: coverResult.thumbnail.fileName 
      });

    } catch (error) {
      logger.error('Background cover generation failed', {
        bookId,
        error: error.message,
        stack: error.stack,
        errorType: error.name,
        duration: `${Date.now() - (this.processingQueue.get(bookId)?.startTime || Date.now())}ms`
      });
      
      // Categorize errors for better debugging
      if (error.code === 'ENOENT') {
        logger.error('File not found during cover generation', { bookId });
      } else if (error.code === 'ETIMEDOUT') {
        logger.error('Timeout during cover generation', { bookId });
      } else if (error.message.includes('Python')) {
        logger.error('Python execution error during cover generation', { bookId });
      }
    } finally {
      this.processingQueue.delete(bookId);
      
      // Log queue size for monitoring
      if (this.processingQueue.size > 0) {
        logger.debug('Active cover generation jobs', { 
          queueSize: this.processingQueue.size,
          jobs: Array.from(this.processingQueue.keys())
        });
      }
    }
  }

  /**
   * Try to generate cover synchronously (for small files)
   * Falls back to background generation if it takes too long
   * @param {Buffer} buffer - File buffer
   * @param {string} fileType - File type
   * @param {string} originalName - Original filename
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Cover result or null
   */
  async tryGenerateCoverSync(buffer, fileType, originalName, userId) {
    // Validate buffer exists and is valid
    if (!buffer || !Buffer.isBuffer(buffer)) {
      logger.error('Invalid buffer provided for cover generation', { originalName });
      return null;
    }

    // Skip for very large files
    const MAX_SYNC_SIZE = 30 * 1024 * 1024; // 30MB
    if (buffer.length > MAX_SYNC_SIZE) {
      logger.info('File too large for sync cover generation, will process in background', {
        size: buffer.length,
        maxSize: MAX_SYNC_SIZE,
        originalName
      });
      return null;
    }

    try {
      // Try to generate cover with timeout
      const coverBuffer = await this.generateCoverImage(buffer, fileType, originalName);
      const coverResult = await this.processAndUploadCover(coverBuffer, originalName, userId);
      
      return coverResult.thumbnail;
    } catch (error) {
      logger.warn('Sync cover generation failed, will retry in background', {
        error: error.message,
        originalName
      });
      return null;
    }
  }
}

module.exports = CoverGenerationService;
