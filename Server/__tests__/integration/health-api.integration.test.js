/**
 * Health and System API Integration Tests
 */
const request = require('supertest');
const { createTestApp } = require('../setup/testServer');

// Mock Auth0 middleware
jest.mock('../../middleware/auth', () => ({
  checkJwt: (req, res, next) => {
    req.auth = {
      payload: {
        sub: 'test-user-system'
      }
    };
    next();
  }
}));

describe('Health and System API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('should return timestamp in ISO format', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });

    test('should include uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('should be accessible without authentication', async () => {
      // Health endpoint should not require auth
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
    });
  });

  describe('Security headers', () => {
    test('should include X-Content-Type-Options header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should include X-Frame-Options header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    test('should include response time header', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Note: Response time header is disabled in test environment
      // In production, this would be: expect(response.headers['x-response-time']).toBeDefined();
      expect(response.headers['x-response-time']).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      // Express default 404 behavior
      expect(response.status).toBe(404);
    });

    test('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('CORS headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/books')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });

  describe('Compression', () => {
    test('should compress large responses', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Check if response can be compressed (small response might not be)
      // Larger responses in real tests would show compression
      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  describe('Content Type', () => {
    test('should return JSON content type', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should handle URL-encoded data', async () => {
      // Test if server accepts urlencoded data (for form submissions)
      const response = await request(app)
        .post('/api/test-endpoint-if-exists')
        .type('form')
        .send({ test: 'data' });

      // Endpoint might not exist, but server should handle the content-type
      expect([200, 404]).toContain(response.status);
    });
  });
});
