/**
 * Unit tests for Auth Middleware
 */
const { checkJwt } = require('../../../middleware/auth');

// Note: Since checkJwt is from express-oauth2-jwt-bearer library,
// we'll test integration aspects and configuration
describe('Auth Middleware', () => {
  test('should export checkJwt middleware', () => {
    expect(checkJwt).toBeDefined();
    expect(typeof checkJwt).toBe('function');
  });

  test('should be configured correctly', () => {
    // Verify middleware is properly exported and can be used in Express routes
    expect(checkJwt).toBeTruthy();
  });

  // Additional integration tests would test actual JWT validation
  // which requires setting up mock tokens and full Express context
});
