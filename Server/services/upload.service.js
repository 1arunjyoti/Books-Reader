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
const { 
  validatePythonExecutable, 
  validateScriptPath, 
  sanitizeCommandArgs,
  getSafeExecutionEnvironment 
} = require('../utils/commandSecurity');
const fs = require('fs');
const path = require('path');
const os = require('os');
const util = require('util');
const { execFile } = require('child_process');
const execFileAsync = util.promisify(execFile);
const sharp = require('sharp');

/**
 * Upload Service
 * Handles all business logic related to file uploads
 */

class UploadService {
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
    // Try to generate a cover image from the PDF and upload it to B2.
    // This uses the existing Python script `Server/Cover_Image_Generator/Cover_Image_extractor.py`.
    // If cover generation fails we continue without blocking the upload.
    let coverUploadResult = null;
    try {
      // Only attempt cover generation for supported types
      if (!['pdf', 'epub', 'txt'].includes(fileType)) {
        throw new Error(`Cover generation not supported for file type: ${fileType}`);
      }

      const scriptPath = path.join(__dirname, '..', 'Cover_Image_Generator', 'Cover_Image_extractor.py');
      const tmpDir = os.tmpdir();
      // Use original file extension so the python script can detect type if needed
      const tmpExt = extension || (fileType === 'pdf' ? 'pdf' : fileType);
      const tmpFilePath = path.join(tmpDir, `${randomFileName()}.${tmpExt}`);
      await fs.promises.writeFile(tmpFilePath, buffer);

      // SECURITY: Validate Python executable and script path
      const pythonExecRaw = process.env.COVER_PYTHON_PATH || 'python';
      const pythonExec = await validatePythonExecutable(pythonExecRaw);
      
      // Validate script path (must be in Cover_Image_Generator directory)
      const allowedScriptDir = path.join(__dirname, '..', 'Cover_Image_Generator');
      const validatedScriptPath = await validateScriptPath(scriptPath, allowedScriptDir);
      
      logger.debug('Invoking cover generation python', { 
        pythonExec, 
        scriptPath: validatedScriptPath, 
        tmpFilePath 
      });
      
      // SECURITY: Sanitize arguments to prevent injection
      const args = sanitizeCommandArgs([validatedScriptPath, tmpFilePath, '--type', fileType]);
      
      // SECURITY: Use safe execution environment
      const safeEnv = getSafeExecutionEnvironment();
      
      // Pass file type as an extra argument in case the script accepts it (backwards compatible)
      // Capture stdout so we can read the exact output path the script prints
      let stdout = '';
      try {
        const result = await execFileAsync(
          pythonExec, 
          args, 
          { 
            timeout: 60000,
            env: safeEnv,
            maxBuffer: 10 * 1024 * 1024 // 10MB max output
          }
        );
        stdout = result.stdout || '';
      } catch (pyErr) {
        // If python fails, rethrow to be handled by outer catch
        logger.error('Python cover generation failed', {
          error: pyErr.message,
          stderr: pyErr.stderr
        });
        throw pyErr;
      }

      // Determine generated image path from python stdout.
      // The script may print messages like "Done, your cover photo has been saved as C:\...\cover.jpg".
      // Extract any embedded path that ends with a common image extension.
      let tmpPngPath = null;
      if (stdout) {
        // Find all substrings that look like image paths (Windows or Unix paths)
        const regex = /([A-Za-z]:\\[^\s]*?\.(?:png|jpe?g|webp|bmp|tiff?))|((?:\/|\.\/)[^\s]*?\.(?:png|jpe?g|webp|bmp|tiff?))|([^\s]+?\.(?:png|jpe?g|webp|bmp|tiff?))/ig;
        const matches = stdout.match(regex);
        if (matches && matches.length > 0) {
          // Prefer the last match (likely the most recent/explicit output)
          tmpPngPath = matches[matches.length - 1].trim();
          // If path is not absolute, resolve relative to temp file directory
          if (!path.isAbsolute(tmpPngPath)) {
            tmpPngPath = path.join(path.dirname(tmpFilePath), tmpPngPath);
          }
        }
      }

      // Fallback: assume PNG next to temp file
      if (!tmpPngPath) tmpPngPath = tmpFilePath.replace(new RegExp(`\.${tmpExt}$`, 'i'), '.png');

      // Read generated image (if any)
      const producedBuffer = await fs.promises.readFile(tmpPngPath);

      // Detect produced image type
      let ft = await FileType.fromBuffer(producedBuffer).catch(() => null);
      if (!ft) {
        // fallback to extension of produced path
        const ext = path.extname(tmpPngPath).replace('.', '').toLowerCase() || 'png';
        ft = { ext, mime: `image/${ext === 'jpg' ? 'jpeg' : ext}` };
      }

      // Upload original as-is under covers/originals/
      const originalFileName = `covers/originals/${randomFileName()}.${ft.ext}`;
      const originalUploadResult = await this.uploadFileToStorage(producedBuffer, originalFileName, {
        originalName: `${originalName}-cover.${ft.ext}`,
        uploadedAt: new Date().toISOString(),
        userId,
      }, ft.mime);

      // Generate thumbnail 300x450 WEBP for library cards
      const thumbBuffer = await sharp(producedBuffer)
        .resize(300, 450, { fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();

      const thumbFileName = `covers/thumbs/${randomFileName()}.webp`;
      const thumbUploadResult = await this.uploadFileToStorage(thumbBuffer, thumbFileName, {
        originalName: `${originalName}-thumb.webp`,
        uploadedAt: new Date().toISOString(),
        userId,
      }, 'image/webp');

      // Use thumbnail as the coverUrl stored in DB
      coverUploadResult = thumbUploadResult;
      // Optionally preserve original upload result for further use (not saved to DB by default)
      coverUploadResult.original = originalUploadResult;

      // Cleanup temp files
      await fs.promises.unlink(tmpFilePath).catch(() => {});
      await fs.promises.unlink(tmpPngPath).catch(() => {});
    } catch (err) {
      logger.warn('Cover generation/upload failed, continuing without cover', {
        error: err.message,
        originalName,
        userId,
      });
      coverUploadResult = null;
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
    
    // Save to database
    const book = await this.saveBookToDatabase(bookData);
    
    return {
      success: true,
      book,
      fileName,
      fileUrl: uploadResult.fileUrl,
      fileId: uploadResult.fileId,
      metadata: uploadMetadata
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
