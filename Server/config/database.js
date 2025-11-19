const { PrismaClient } = require('@prisma/client');
const { config } = require('./index');

// Note: Logger is loaded lazily to avoid circular dependency
let logger;
const getLogger = () => {
  if (!logger) logger = require('../utils/logger');
  return logger;
};

/**
 * Database configuration and Prisma client instance
 * This file creates a single instance of PrismaClient to reuse across the application
 * This prevents "too many database connections" errors
 * 
 * Connection Pooling:
 * - Prisma uses a connection pool by default (implemented via the underlying database driver)
 * - Pool size can be configured via DATABASE_URL connection_limit parameter
 * - Default pool size is based on available CPU cores and database limits
 */

// Calculate optimal connection pool size
// Formula: (num_cores * 2) + effective_spindle_count
// For cloud databases, typically 10-20 connections per instance
const calculatePoolSize = () => {
  const cpuCount = require('os').cpus().length;
  // Conservative default: 2 connections per CPU, minimum 5, maximum 20
  const poolSize = Math.max(5, Math.min(20, cpuCount * 2));
  return poolSize;
};

// Add connection pool parameters to DATABASE_URL if not present
const configureConnectionPool = (databaseUrl) => {
  const url = new URL(databaseUrl);
  const params = url.searchParams;
  
  // Set connection pool size if not already set
  if (!params.has('connection_limit')) {
    params.set('connection_limit', calculatePoolSize().toString());
  }
  
  // Set connection timeout (default: 10 seconds)
  if (!params.has('connect_timeout')) {
    params.set('connect_timeout', '10');
  }
  
  // Set pool timeout (how long to wait for a connection from the pool)
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', '10');
  }
  
  return url.toString();
};

const prisma = new PrismaClient({
  log: config.database.logLevel,
  datasources: {
    db: {
      url: configureConnectionPool(config.database.url),
    },
  },
});

// Log connection pool configuration on startup
prisma.$connect().then(() => {
  const url = new URL(configureConnectionPool(config.database.url));
  const poolSize = url.searchParams.get('connection_limit') || 'default';
  const connectTimeout = url.searchParams.get('connect_timeout') || 'default';
  const poolTimeout = url.searchParams.get('pool_timeout') || 'default';
  
  getLogger().info('Database connected with connection pooling', {
    poolSize,
    connectTimeout: `${connectTimeout}s`,
    poolTimeout: `${poolTimeout}s`,
    database: url.pathname.replace('/', ''),
    host: url.hostname,
  });
}).catch((error) => {
  getLogger().error('Failed to connect to database', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Graceful shutdown - disconnect from database when process exits
process.on('beforeExit', async () => {
  // Stop stats logging
  const { stopStatsLogging } = require('../middleware/responseTimeMonitor');
  stopStatsLogging();
  
  await prisma.$disconnect();
  getLogger().info('Database connection closed');
});

// Handle unexpected errors
process.on('SIGINT', async () => {
  // Stop stats logging
  const { stopStatsLogging } = require('../middleware/responseTimeMonitor');
  stopStatsLogging();
  
  await prisma.$disconnect();
  getLogger().info('Database connection closed due to SIGINT');
  process.exit(0);
});

// Handle termination signal
process.on('SIGTERM', async () => {
  // Stop stats logging
  const { stopStatsLogging } = require('../middleware/responseTimeMonitor');
  stopStatsLogging();
  
  await prisma.$disconnect();
  getLogger().info('Database connection closed due to SIGTERM');
  process.exit(0);
});

module.exports = prisma;
