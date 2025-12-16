const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 250 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again after 15 minutes'
    });
  }
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again after 15 minutes'
    });
  }
});

// Rate limiter for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each IP to 100 uploads per hour
  message: 'Too many upload requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many upload requests, please try again after an hour'
    });
  }
});

// Rate limiter for book operations (reading, bookmarks, highlights)
const bookOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow more requests for book operations
  message: 'Too many book operation requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Book operations rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many book operation requests, please try again after 15 minutes'
    });
  }
});

// Rate limiter for cover generation (more restrictive)
const coverGenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit to 100 cover generations per hour (resource intensive)
  message: 'Too many cover generation requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Cover generation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many cover generation requests, please try again after an hour'
    });
  }
});

// Rate limiter for welcome screen endpoints
const welcomeScreenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per 15 minutes
  message: 'Too many welcome screen requests, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Welcome screen rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many welcome screen requests, please try again after 15 minutes'
    });
  }
});

// Rate limiter for sensitive account operations (email/password change, delete)
const sensitiveOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // STRICT: Only 5 attempts per 15 minutes for security
  message: 'Too many attempts for sensitive operations, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive operations rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
    res.status(429).json({
      error: 'Too many attempts for sensitive operations, please try again after 15 minutes'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  uploadLimiter,
  bookOperationsLimiter,
  coverGenerationLimiter,
  welcomeScreenLimiter,
  sensitiveOperationsLimiter, // Export new limiter
};
