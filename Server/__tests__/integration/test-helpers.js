/**
 * Integration Test Helper
 * Provides utilities for integration testing
 */
const request = require('supertest');

/**
 * Create a mock authenticated request
 */
function mockAuthRequest(app, method, url, token = 'mock-token') {
  const req = request(app)[method](url);
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}

/**
 * Generate a mock JWT token for testing
 */
function generateMockToken(userId = 'test-user-123', expiresIn = '1h') {
  // In real tests, you'd use a proper JWT library
  // For now, return a mock token structure
  return {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 0)
  };
}

/**
 * Create test database records
 */
async function createTestBook(prisma, userId, overrides = {}) {
  return await prisma.book.create({
    data: {
      userId,
      title: 'Test Book',
      author: 'Test Author',
      fileKey: 'test-file-key',
      fileType: 'pdf',
      fileSize: 1024000,
      status: 'unread',
      ...overrides
    }
  });
}

/**
 * Clean up test database records
 */
async function cleanupTestData(prisma, userId) {
  await prisma.book.deleteMany({
    where: { userId }
  });
  
  await prisma.bookmark.deleteMany({
    where: { userId }
  });
  
  await prisma.highlight.deleteMany({
    where: { userId }
  });
}

module.exports = {
  mockAuthRequest,
  generateMockToken,
  createTestBook,
  cleanupTestData
};
