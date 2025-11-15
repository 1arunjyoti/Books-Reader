require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config, validateConfig } = require('./config');

// Import logger first (uses default config if validation fails)
const logger = require('./utils/logger');

// Validate configuration before starting server
try {
  validateConfig();
} catch (error) {
  logger.error('Configuration Error:', error.message);
  process.exit(1);
}

// Import middlewares
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { responseTimeMonitor, startStatsLogging, getStatsEndpoint } = require('./middleware/responseTimeMonitor');

// Import routes
const apiRoutes = require('./routes');

const app = express();
const PORT = config.server.port;

// Security headers middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      imgSrc: ["'self'", 'data:', 'https:'], // Allow images from https and data URIs
      connectSrc: ["'self'", config.server.clientUrl], // Allow connections to client URL
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
}));

// Trust proxy for correct IP detection behind reverse proxies
app.set('trust proxy', 1);

// Response compression middleware
app.use(compression({
  // Compress all responses over 1kb
  threshold: 1024,
  // Compression level (0-9, 6 is default balance of speed/compression)
  level: 6,
  // Only compress responses with these types
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter
    return compression.filter(req, res);
  }
}));

// CORS configuration
app.use(cors({
  origin: config.server.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Request timeout middleware for upload routes (5 minutes max)
app.use('/api/upload', (req, res, next) => {
  // Set timeout to 5 minutes for upload endpoints
  req.setTimeout(5 * 60 * 1000);
  res.setTimeout(5 * 60 * 1000);
  
  // Handle timeout event
  req.on('timeout', () => {
    logger.error('Request timeout on upload endpoint', { 
      ip: req.ip,
      originalUrl: req.originalUrl 
    });
  });
  
  next();
});

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  strict: true 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Response time monitoring middleware
// Place after compression and body parsers so earlier middleware (like compression)
// doesn't replace res.end and prevent the middleware from setting headers.
app.use(responseTimeMonitor);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  // Include uptime so external smoke tests can report it
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Performance statistics endpoint (for monitoring/debugging)
app.get('/api/stats', getStatsEndpoint);

// Mount API routes
app.use('/api', apiRoutes);

// Use error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`Client URL: ${config.server.clientUrl}`);
  logger.info('Server ready to accept connections');
  
  // Start periodic performance statistics logging
  startStatsLogging();
  logger.info('Performance monitoring enabled');
});
