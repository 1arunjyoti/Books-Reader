const logger = require('./logger');

/**
 * Extract metadata from a TXT file buffer
 * @param {Buffer} buffer - The TXT file buffer
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} - Metadata object with title, stats, etc.
 */
async function extractTxtMetadata(buffer, originalName) {
  try {
    const content = buffer.toString('utf8');
    
    // Try to extract title from filename (remove extension)
    const title = originalName.replace(/\.txt$/i, '').replace(/_/g, ' ');
    
    // Calculate basic statistics
    const lines = content.split(/\r?\n/);
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const characters = content.length;
    
    // Estimate reading sections (divide into ~5000 character chunks)
    const sectionSize = 5000;
    const estimatedSections = Math.ceil(characters / sectionSize);
    
    // Try to detect author from first few lines (common in ebooks)
    let author = 'Unknown Author';
    const firstLines = lines.slice(0, 20).join('\n');
    
    // Common patterns for author detection
    const authorPatterns = [
      /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /author:\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /written\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    ];
    
    for (const pattern of authorPatterns) {
      const match = firstLines.match(pattern);
      if (match && match[1]) {
        author = match[1].trim();
        break;
      }
    }
    
    const metadata = {
      title,
      author,
      language: 'en', // Default to English
      publisher: null,
      description: null,
      isbn: null,
      publicationDate: null,
      // TXT-specific metadata
      totalLines: lines.length,
      nonEmptyLines: nonEmptyLines.length,
      totalWords: words.length,
      totalCharacters: characters,
      totalSections: estimatedSections,
      encoding: 'utf8',
    };

    return metadata;
  } catch (error) {
    logger.error('Error extracting TXT metadata:', { error: error.message });
    throw error;
  }
}

/**
 * Validate if a buffer is a valid text file
 * @param {Buffer} buffer - The file buffer to validate
 * @returns {boolean} - True if valid text file
 */
function isValidTxt(buffer) {
  try {
    // Try to decode as UTF-8
    const content = buffer.toString('utf8');
    
    // Check for null bytes (binary files)
    if (content.includes('\0')) {
      return false;
    }
    
    // Check if most characters are printable
    const printableChars = content.match(/[\x20-\x7E\r\n\t]/g) || [];
    const printableRatio = printableChars.length / content.length;
    
    // If more than 80% of characters are printable, consider it valid text
    return printableRatio > 0.8;
  } catch (error) {
    logger.error('Error validating TXT:', { error: error.message });
    return false;
  }
}

/**
 * Process text content for storage and display
 * @param {Buffer} buffer - The TXT file buffer
 * @returns {Object} - Processed content with metadata
 */
function processTxtContent(buffer) {
  try {
    const content = buffer.toString('utf8');
    
    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split into sections for easier navigation
    const sectionSize = 5000; // ~5000 characters per section
    const sections = [];
    
    for (let i = 0; i < normalizedContent.length; i += sectionSize) {
      sections.push({
        index: Math.floor(i / sectionSize),
        content: normalizedContent.slice(i, i + sectionSize),
        startPos: i,
        endPos: Math.min(i + sectionSize, normalizedContent.length),
      });
    }
    
    return {
      fullContent: normalizedContent,
      sections,
      totalSections: sections.length,
    };
  } catch (error) {
    logger.error('Error processing TXT content:', { error: error.message });
    throw error;
  }
}

module.exports = {
  extractTxtMetadata,
  isValidTxt,
  processTxtContent,
};
