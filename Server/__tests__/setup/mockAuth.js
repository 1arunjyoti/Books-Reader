/**
 * Mock Authentication Middleware for Integration Tests
 * Replaces Clerk JWT validation with a simple mock
 */

/**
 * Create a mock authentication middleware that sets req.auth
 */
function mockAuthMiddleware(userId = 'test-user-123', options = {}) {
  return (req, res, next) => {
    // Set the auth object that would normally come from Clerk
    // Clerk sets req.auth.userId directly
    req.auth = {
      userId: userId,
      sessionId: options.sessionId || 'test-session-123',
      ...options
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
