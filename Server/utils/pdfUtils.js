const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const logger = require('./logger');

/**
 * Extract metadata from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Object>} Metadata object
 */
async function extractPdfMetadata(buffer) {
  try {
    const data = await pdfParse(buffer);
    
    // Extract basic info
    const metadata = {
      title: data.info?.Title || null,
      author: data.info?.Author || null,
      subject: data.info?.Subject || null,
      keywords: data.info?.Keywords || null,
      creator: data.info?.Creator || null,
      producer: data.info?.Producer || null,
      creationDate: data.info?.CreationDate || null,
      modificationDate: data.info?.ModDate || null,
      totalPages: data.numpages || 0,
      version: data.version || null,
    };

    // Clean up title and author
    if (metadata.title) {
      metadata.title = metadata.title.trim();
    }
    if (metadata.author) {
      metadata.author = metadata.author.trim();
    }

    // Try to extract publication year from creation date or mod date
    let publicationYear = null;
    const dateStr = metadata.creationDate || metadata.modificationDate;
    if (dateStr) {
      // PDF dates are in format: D:YYYYMMDDHHmmSSOHH'mm'
      const yearMatch = dateStr.match(/D:(\d{4})/);
      if (yearMatch) {
        publicationYear = parseInt(yearMatch[1], 10);
      }
    }

    return {
      ...metadata,
      publicationYear,
      rawMetadata: JSON.stringify(data.info || {})
    };
  } catch (error) {
    logger.error('Error extracting PDF metadata:', { error: error.message });
    return {
      title: null,
      author: null,
      totalPages: 0,
      publicationYear: null,
      rawMetadata: JSON.stringify({ error: error.message })
    };
  }
}

/**
 * Generate a cover image from the first page of a PDF
 * @param {Buffer} buffer - PDF file buffer
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} Cover image buffer (JPEG)
 */
async function generateCoverImage(buffer, options = {}) {
  try {
    const {
      width = 400,
      quality = 80,
      format = 'jpeg'
    } = options;

    // Load the PDF
    const pdfDoc = await PDFDocument.load(buffer);
    
    if (pdfDoc.getPageCount() === 0) {
      throw new Error('PDF has no pages');
    }

    // Get the first page
    const firstPage = pdfDoc.getPage(0);
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();

    // Note: pdf-lib doesn't have built-in rendering to image
    // We'll need to use a different approach with node-canvas or puppeteer
    // For now, we'll return null and implement this later with a proper renderer
    
    logger.warn('Cover generation requires additional setup (node-canvas or puppeteer)');
    return null;

  } catch (error) {
    logger.error('Error generating cover image:', { error: error.message });
    return null;
  }
}

/**
 * Get a simple text representation of PDF content (first page)
 * @param {Buffer} buffer - PDF file buffer
 * @param {number} maxLength - Maximum length of text to return
 * @returns {Promise<string>} Text content
 */
async function extractTextPreview(buffer, maxLength = 500) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text || '';
    
    // Return first N characters
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    
    return text;
  } catch (error) {
    logger.error('Error extracting text preview:', { error: error.message });
    return '';
  }
}

/**
 * Validate if a buffer is a valid PDF
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<boolean>} True if valid PDF
 */
async function isValidPdf(buffer) {
  try {
    await PDFDocument.load(buffer);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  extractPdfMetadata,
  generateCoverImage,
  extractTextPreview,
  isValidPdf
};
