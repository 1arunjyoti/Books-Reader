const multer = require('multer');
const logger = require('../utils/logger');

// Global error handling middleware
const errorHandler = (error, req, res, next) => {
  // Multer file upload errors - keep current behavior
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }
    return res.status(400).json({ error: error.message });
  }

  // Map known auth library error names to 401 where appropriate.
  // Some auth libraries return a 400 InvalidRequestError for missing
  // or malformed Authorization headers; tests expect 401, so normalize
  // these to 401 for auth-related error names.
  if (error && error.name && /InvalidRequestError|InvalidTokenError|Unauthorized|Auth/i.test(error.name)) {
    logger.warn('Auth error', {
      name: error.name,
      message: error.message,
      url: req.originalUrl,
      method: req.method
    });
    return res.status(401).json({ error: error.message || 'Unauthorized' });
  }

  // If the error includes an explicit HTTP status (libraries like
  // express-oauth2-jwt-bearer set `error.status`), honor it so other
  // middleware errors can flow through with their intended codes.
  if (error && typeof error.status === 'number' && error.status >= 400 && error.status < 600) {
    logger.warn('Handled http error', {
      status: error.status,
      message: error.message,
      url: req.originalUrl,
      method: req.method
    });
    return res.status(error.status).json({ error: error.message || 'Request error' });
  }

  // Fallback: log and return 500
  logger.error('Unhandled error', { 
    error: error?.message, 
    stack: error?.stack,
    url: req.originalUrl,
    method: req.method
  });
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorHandler };
