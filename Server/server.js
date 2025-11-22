require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config, validateConfig } = require('./config');
const { clerkMiddleware } = require('@clerk/express');

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
const { responseTimeMonitor, startStatsLogging, stopStatsLogging, getStatsEndpoint } = require('./middleware/responseTimeMonitor');

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
      scriptSrcAttr: ["'none'"], // Block inline event handlers
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (needed for some responses)
      imgSrc: ["'self'", 'data:', 'https:'], // Allow images from https and data URIs
      connectSrc: ["'self'", config.server.clientUrl], // Allow connections to client URL
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [], // Enable upgrade-insecure-requests
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  originAgentCluster: true,
  xContentTypeOptions: true,
  xDnsPrefetchControl: { allow: false },
  xDownloadOptions: true,
  xFrameOptions: { action: 'deny' },
  xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
  xPoweredBy: false,
  xXssProtection: true,
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
  strict: true,
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Debug middleware to check Authorization header
const fs = require('fs');
const path = require('path');

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.path} - Auth: ${req.headers.authorization ? 'Present' : 'Missing'}\n`;
    try {
      fs.appendFileSync(path.join(__dirname, 'debug_auth.log'), logLine);
      if (req.headers.authorization) {
        fs.appendFileSync(path.join(__dirname, 'debug_auth.log'), `Token: ${req.headers.authorization.substring(0, 20)}...\n`);
      }
    } catch (e) {
      console.error('Error writing to debug log:', e);
    }
  }
  next();
});

// Clerk authentication middleware
app.use(clerkMiddleware({
  publishableKey: config.clerk.publishableKey,
  secretKey: config.clerk.secretKey,
}));

// Response time monitoring middleware
// Place after compression and body parsers so earlier middleware (like compression)
// doesn't replace res.end and prevent the middleware from setting headers.
app.use(responseTimeMonitor);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'BooksReader API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      stats: '/api/stats'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  // Include uptime so external smoke tests can report it
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Debug endpoint to test collections
app.get('/api/test-collections', (req, res) => {
  logger.info('Test collections endpoint hit');
  res.json({ message: 'Collections endpoint is working', path: req.originalUrl });
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
