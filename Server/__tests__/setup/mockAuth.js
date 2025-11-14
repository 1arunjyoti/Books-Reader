/**
 * Mock Authentication Middleware for Integration Tests
 * Replaces Auth0 JWT validation with a simple mock
 */

/**
 * Create a mock authentication middleware that sets req.auth
 */
function mockAuthMiddleware(userId = 'test-user-123', options = {}) {
  return (req, res, next) => {
    // Set the auth object that would normally come from Auth0
    req.auth = {
      payload: {
        sub: userId,
        ...options
      }
    };
    next();
  };
}

/**
 * Create a middleware that rejects authentication
 */
function mockUnauthorizedMiddleware() {
  return (req, res, next) => {
    res.status(401).json({ error: 'Unauthorized' });
  };
}

module.exports = {
  mockAuthMiddleware,
  mockUnauthorizedMiddleware
};
