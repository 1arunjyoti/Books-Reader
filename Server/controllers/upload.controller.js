const uploadService = require('../services/upload.service');
const logger = require('../utils/logger');

/**
 * Upload Controller
 * Handles HTTP requests/responses for file uploads
 * Business logic delegated to upload.service.js
 */

/**
 * Upload file from local system
 */
exports.uploadFile = async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user ID
    const userId = req.auth?.payload?.sub || 'anonymous';
    
    logger.info('Starting file upload', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      userId
    });
    
    // Process upload using service
    const result = await uploadService.processFileUpload(
      req.file.buffer,
      req.file.originalname,
      req.file.size,
      userId
    );

    const duration = Date.now() - startTime;
    logger.info('File upload completed', {
      fileName: req.file.originalname,
      duration: `${duration}ms`,
      userId
    });

    // Return success response
    res.json(result);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error uploading file', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      userId: req.auth?.payload?.sub
    });
    
    // Ensure we haven't sent headers yet
    if (res.headersSent) {
      logger.error('Headers already sent, cannot send error response');
      return;
    }
    
    // Handle validation errors
    if (error.message.includes('Invalid') || 
        error.message.includes('exceeds') || 
        error.message.includes('Only')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle timeout errors
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Upload processing timed out',
        message: 'The file upload is taking too long. Please try a smaller file or try again later.'
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
};

/**
 * Upload file from URL
 */
exports.uploadFromUrl = async (req, res) => {
  try {
    const { url } = req.body;
    
    // Validate request
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Get user ID
    const userId = req.auth?.payload?.sub || 'anonymous';

    // Process URL upload using service
    const result = await uploadService.processUrlUpload(url, userId);

    // Return success response
    res.json(result);

  } catch (error) {
    logger.error('Error uploading file from URL', {
      error: error.message,
      stack: error.stack,
      url: req.body.url,
      userId: req.auth?.payload?.sub
    });
    
    // Handle specific errors
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: error.message });
    }
    
    if (error.message.includes('Invalid URL') || 
        error.message.includes('Invalid file type') ||
        error.message.includes('Could not download')) {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: 'Failed to upload file from URL',
      message: error.message 
    });
  }
};
