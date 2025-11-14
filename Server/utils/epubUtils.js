const EPub = require('epub');
const logger = require('./logger');

/**
 * Extract metadata from an EPUB file buffer
 * @param {Buffer} buffer - The EPUB file buffer
 * @returns {Promise<Object>} - Metadata object with title, author, etc.
 */
async function extractEpubMetadata(buffer) {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary epub instance from buffer
      const epub = new EPub(buffer);
      
      epub.on('error', (error) => {
        logger.error('Error parsing EPUB:', { error: error.message });
        reject(error);
      });

      epub.on('end', () => {
        try {
          const metadata = {
            title: epub.metadata.title || 'Unknown Title',
            author: epub.metadata.creator || epub.metadata.author || 'Unknown Author',
            language: epub.metadata.language || 'en',
            publisher: epub.metadata.publisher || null,
            description: epub.metadata.description || null,
            isbn: epub.metadata.ISBN || null,
            publicationDate: epub.metadata.date || null,
            // EPUB-specific metadata
            spine: epub.flow || [],
            toc: epub.toc || [],
            manifest: epub.manifest || {},
            // Estimate sections/chapters count
            totalSections: epub.flow ? epub.flow.length : 0,
          };

          resolve(metadata);
        } catch (error) {
          logger.error('Error extracting EPUB metadata:', { error: error.message });
          reject(error);
        }
      });

      // Parse the EPUB
      epub.parse();
    } catch (error) {
      logger.error('Error initializing EPUB parser:', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Validate if a buffer is a valid EPUB file
 * @param {Buffer} buffer - The file buffer to validate
 * @returns {boolean} - True if valid EPUB
 */
function isValidEpub(buffer) {
  try {
    // EPUB files are ZIP archives, check for PK header
    const zipHeader = buffer.slice(0, 4).toString('hex');
    const isZip = zipHeader === '504b0304' || zipHeader === '504b0506';
    
    if (!isZip) {
      return false;
    }

    // Additional check: look for mimetype file (should be first in EPUB)
    const mimetypeCheck = buffer.toString('utf8', 30, 68);
    return mimetypeCheck.includes('application/epub+zip');
  } catch (error) {
    logger.error('Error validating EPUB:', { error: error.message });
    return false;
  }
}

module.exports = {
  extractEpubMetadata,
  isValidEpub,
};
