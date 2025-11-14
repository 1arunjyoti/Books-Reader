/**
 * Test Server Setup for Integration Tests
 * Creates an Express app instance for testing without starting the server
 */
require('dotenv').config({ path: '.env.test' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { config } = require('../../config');

// Import middlewares
const { errorHandler } = require('../../middleware/errorHandler');
const { responseTimeMonitor } = require('../../middleware/responseTimeMonitor');

// Import routes
const apiRoutes = require('../../routes');

// Create Express app
function createTestApp() {
  const app = express();

  // Minimal security headers for testing
  app.use(helmet({ contentSecurityPolicy: false }));

  // Response time monitoring
  app.use(responseTimeMonitor);

  // Response compression
  app.use(compression());

  // CORS configuration
  app.use(cors({
    origin: config.server.clientUrl,
    credentials: true
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb', strict: true }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime() 
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // Error handler middleware
  app.use(errorHandler);

  return app;
}

module.exports = { createTestApp };
