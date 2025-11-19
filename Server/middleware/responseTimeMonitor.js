const logger = require('../utils/logger');

/**
 * Response Time Monitoring Middleware
 * Tracks and logs response times for all API requests
 * Helps identify slow endpoints and performance bottlenecks
 */

// Store response time statistics
const stats = {
  totalRequests: 0,
  totalDuration: 0,
  slowRequests: 0,
  errorRequests: 0,
  byEndpoint: new Map(),
  byMethod: new Map(),
};

// Configuration
const SLOW_THRESHOLD_MS = 1000; // Log warning for requests > 1 second
const STATS_LOG_INTERVAL_MS = 60000; // Log stats every minute

/**
 * Response time monitoring middleware
 */
function responseTimeMonitor(req, res, next) {
  const startTime = process.hrtime.bigint();
  const startDate = new Date();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end function to capture response time
  res.end = function(...args) {
    // Calculate response time
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1_000_000; // Convert nanoseconds to milliseconds
    
    // Add response time header (skip in test environment to prevent conflicts)
    if (process.env.NODE_ENV !== 'test') {
      try {
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
      } catch (error) {
        // Ignore header setting errors (e.g., headers already sent)
      }
    }
    
    // Update statistics
    updateStats(req, res, durationMs);
    
    // Log request details
    logRequest(req, res, durationMs, startDate);
    
    // Call original end function
    return originalEnd.apply(res, args);
  };
  
  next();
}

/**
 * Update statistics
 */
function updateStats(req, res, durationMs) {
  stats.totalRequests++;
  stats.totalDuration += durationMs;
  
  if (durationMs > SLOW_THRESHOLD_MS) {
    stats.slowRequests++;
  }
  
  if (res.statusCode >= 400) {
    stats.errorRequests++;
  }
  
  // Track by endpoint (path pattern)
  const endpoint = getEndpointPattern(req.path);
  if (!stats.byEndpoint.has(endpoint)) {
    stats.byEndpoint.set(endpoint, {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0,
    });
  }
  const endpointStats = stats.byEndpoint.get(endpoint);
  endpointStats.count++;
  endpointStats.totalDuration += durationMs;
  endpointStats.minDuration = Math.min(endpointStats.minDuration, durationMs);
  endpointStats.maxDuration = Math.max(endpointStats.maxDuration, durationMs);
  if (res.statusCode >= 400) {
    endpointStats.errors++;
  }
  
  // Track by HTTP method
  const method = req.method;
  if (!stats.byMethod.has(method)) {
    stats.byMethod.set(method, {
      count: 0,
      totalDuration: 0,
    });
  }
  const methodStats = stats.byMethod.get(method);
  methodStats.count++;
  methodStats.totalDuration += durationMs;
}

/**
 * Log request details
 */
function logRequest(req, res, durationMs, startDate) {
  const logData = {
    method: req.method,
    path: req.originalUrl || req.path, // Use originalUrl to get full path including /api prefix
    statusCode: res.statusCode,
    duration: `${durationMs.toFixed(2)}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: startDate.toISOString(),
    userId: req.auth?.sub || 'anonymous',
    contentLength: res.get('content-length') || 0,
  };
  
  // Determine log level based on response time and status
  if (durationMs > SLOW_THRESHOLD_MS) {
    logger.warn('Slow request detected', logData);
  } else if (res.statusCode >= 500) {
    logger.error('Server error', logData);
  } else if (res.statusCode >= 400) {
    logger.warn('Client error', logData);
  } else {
    logger.info('Request completed', logData);
  }
}

/**
 * Get endpoint pattern (normalize dynamic segments)
 * /api/books/123 -> /api/books/:id
 * /api/highlights/abc123/search -> /api/highlights/:id/search
 */
function getEndpointPattern(path) {
  return path
    .replace(/\/[0-9a-fA-F]{24}/g, '/:id')  // MongoDB ObjectIds
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:id')  // UUIDs
    .replace(/\/\d+/g, '/:id')  // Numeric IDs
    || '/';
}

/**
 * Get current statistics
 */
function getStats() {
  const avgDuration = stats.totalRequests > 0 
    ? (stats.totalDuration / stats.totalRequests).toFixed(2) 
    : 0;
  
  const slowPercentage = stats.totalRequests > 0
    ? ((stats.slowRequests / stats.totalRequests) * 100).toFixed(2)
    : 0;
  
  const errorPercentage = stats.totalRequests > 0
    ? ((stats.errorRequests / stats.totalRequests) * 100).toFixed(2)
    : 0;
  
  // Calculate endpoint statistics
  const endpointStats = Array.from(stats.byEndpoint.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgDuration: (data.totalDuration / data.count).toFixed(2),
      minDuration: data.minDuration.toFixed(2),
      maxDuration: data.maxDuration.toFixed(2),
      errors: data.errors,
      errorRate: ((data.errors / data.count) * 100).toFixed(2),
    }))
    .sort((a, b) => parseFloat(b.avgDuration) - parseFloat(a.avgDuration));
  
  // Calculate method statistics
  const methodStats = Array.from(stats.byMethod.entries())
    .map(([method, data]) => ({
      method,
      count: data.count,
      avgDuration: (data.totalDuration / data.count).toFixed(2),
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    summary: {
      totalRequests: stats.totalRequests,
      avgDuration: `${avgDuration}ms`,
      slowRequests: stats.slowRequests,
      slowPercentage: `${slowPercentage}%`,
      errorRequests: stats.errorRequests,
      errorPercentage: `${errorPercentage}%`,
    },
    topSlowEndpoints: endpointStats.slice(0, 10),
    methodStats,
  };
}

/**
 * Reset statistics
 */
function resetStats() {
  stats.totalRequests = 0;
  stats.totalDuration = 0;
  stats.slowRequests = 0;
  stats.errorRequests = 0;
  stats.byEndpoint.clear();
  stats.byMethod.clear();
}

// Store interval ID for cleanup
let statsIntervalId = null;

/**
 * Log statistics periodically
 */
function startStatsLogging() {
  // Clear any existing interval to prevent duplicates
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
    statsIntervalId = null;
  }
  
  statsIntervalId = setInterval(() => {
    if (stats.totalRequests === 0) {
      return; // No requests to log
    }
    
    const currentStats = getStats();
    
    logger.info('Performance statistics', currentStats);
    
    // Reset stats for next interval (optional, comment out to keep cumulative)
    // resetStats();
  }, STATS_LOG_INTERVAL_MS);
}

/**
 * Stop statistics logging (for graceful shutdown)
 */
function stopStatsLogging() {
  if (statsIntervalId) {
    clearInterval(statsIntervalId);
    statsIntervalId = null;
    logger.info('Performance statistics logging stopped');
  }
}

/**
 * Stats endpoint for monitoring tools
 */
function getStatsEndpoint(req, res) {
  const currentStats = getStats();
  res.json({
    ...currentStats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}

module.exports = {
  responseTimeMonitor,
  getStats,
  resetStats,
  startStatsLogging,
  stopStatsLogging,
  getStatsEndpoint,
};
