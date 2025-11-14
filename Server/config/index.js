require('dotenv').config();

/**
 * Centralized configuration for the application
 * All environment variables are accessed through this module
 */
const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  // Auth0 configuration
  auth0: {
    domain: process.env.AUTH0_DOMAIN,
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_DOMAIN 
      ? `https://${process.env.AUTH0_DOMAIN}` 
      : undefined,
  },

  // Backblaze B2 storage configuration
  b2: {
    endpoint: process.env.B2_ENDPOINT,
    keyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucketName: process.env.B2_BUCKET_NAME,
    region: process.env.B2_ENDPOINT 
      ? process.env.B2_ENDPOINT.split('.')[1] 
      : undefined,
  },

  // Database configuration
  database: {
    url: process.env.DATABASE_URL,
    logLevel: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  },
};

/**
 * Validate required environment variables
 * Throws an error if any required variables are missing
 */
function validateConfig() {
  const required = {
    'AUTH0_DOMAIN': config.auth0.domain,
    'AUTH0_AUDIENCE': config.auth0.audience,
    'B2_ENDPOINT': config.b2.endpoint,
    'B2_KEY_ID': config.b2.keyId,
    'B2_APPLICATION_KEY': config.b2.applicationKey,
    'B2_BUCKET_NAME': config.b2.bucketName,
    'DATABASE_URL': config.database.url,
  };

  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n\n` +
      `Please check your .env file and ensure all required variables are set.\n` +
      `See .env.example for reference.`
    );
  }

  // Validate PORT is a valid number
  if (isNaN(config.server.port) || config.server.port < 1 || config.server.port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  // Note: We don't use logger here as it may not be initialized yet
  // Logger will log its own initialization message
}

/**
 * Get configuration value safely
 * @param {string} path - Dot-notation path to config value (e.g., 'server.port')
 * @returns {*} Configuration value
 */
function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

module.exports = {
  config,
  validateConfig,
  getConfig,
};
