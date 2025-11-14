const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const { config } = require('../config');

/**
 * Custom log format for console output
 * Provides colored, timestamped logs with context
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present (excluding empty objects)
    if (Object.keys(meta).length > 0 && meta.constructor === Object) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

/**
 * File log format - JSON for easy parsing
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create transports array based on environment
 */
const transports = [];

// Console transport - always enabled
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
    level: config.server.env === 'development' ? 'debug' : 'info',
  })
);

// File transports - production and development
if (config.server.env === 'production') {
  // Error logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep for 14 days
      zippedArchive: true,
    })
  );

  // Combined logs - daily rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
} else {
  // Development - simple file logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: fileFormat,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: fileFormat,
    })
  );
}

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
  // Don't log unhandled exceptions/rejections - we'll handle them separately
  handleExceptions: false,
  handleRejections: false,
});

/**
 * Create a child logger with additional context
 * @param {Object} meta - Metadata to add to all logs from this child
 * @returns {Object} Child logger instance
 * 
 * @example
 * const userLogger = logger.child({ userId: '123' });
 * userLogger.info('User logged in'); // Automatically includes userId in log
 */
logger.child = (meta) => {
  return winston.createLogger({
    level: logger.level,
    transports: logger.transports,
    defaultMeta: meta,
  });
};

/**
 * Helper methods for common logging patterns
 */

/**
 * Log HTTP request
 * @param {Object} req - Express request object
 * @param {number} statusCode - Response status code
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, statusCode, duration) => {
  const meta = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode,
    duration: `${duration}ms`,
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
  };

  if (statusCode >= 500) {
    logger.error('HTTP Request', meta);
  } else if (statusCode >= 400) {
    logger.warn('HTTP Request', meta);
  } else {
    logger.info('HTTP Request', meta);
  }
};

/**
 * Log database operation
 * @param {string} operation - Operation type (query, create, update, delete)
 * @param {string} model - Prisma model name
 * @param {Object} meta - Additional metadata
 */
logger.logDatabase = (operation, model, meta = {}) => {
  logger.debug(`Database ${operation}`, { model, ...meta });
};

/**
 * Log file upload
 * @param {string} fileName - Uploaded file name
 * @param {number} size - File size in bytes
 * @param {string} userId - User ID
 */
logger.logUpload = (fileName, size, userId) => {
  logger.info('File uploaded', {
    fileName,
    size: `${(size / 1024 / 1024).toFixed(2)}MB`,
    userId,
  });
};

/**
 * Log external API call
 * @param {string} service - Service name (e.g., 'Auth0', 'B2')
 * @param {string} operation - Operation performed
 * @param {Object} meta - Additional metadata
 */
logger.logExternalCall = (service, operation, meta = {}) => {
  logger.debug(`External API: ${service}`, { operation, ...meta });
};

/**
 * Stream for Morgan HTTP logger middleware
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Log startup message
logger.info('Logger initialized', {
  environment: config.server.env,
  level: logger.level,
  transports: transports.map(t => t.constructor.name),
});

module.exports = logger;
