const request = require('supertest');

jest.mock('../../middleware/auth', () => {
  const { authState } = require('../setup/securityTestState');

  return {
    checkJwt: (req, res, next) => {
      switch (authState.mode) {
        case 'valid':
          req.auth = {
            payload: {
              sub: authState.userId,
            },
          };
          return next();
        case 'missing':
          return res.status(401).json({ error: 'Authorization header missing or invalid' });
        case 'invalid':
          return res.status(401).json({ error: 'Invalid token signature' });
        case 'expired':
          return res.status(401).json({ error: 'Token expired' });
        case 'passthrough':
          return next();
        default:
          return res.status(401).json({ error: 'Unauthorized' });
      }
    },
  };
});

jest.mock('../../middleware/rateLimiter', () => {
  const actual = jest.requireActual('../../middleware/rateLimiter');
  const { rateLimiterState } = require('../setup/securityTestState');

  const messages = {
    bookOperations: 'Too many book operation requests, please try again after 15 minutes',
    welcomeScreen: 'Too many welcome screen requests, please try again after 15 minutes',
  };

  const createTestLimiter = (key, fallback) => (req, res, next) => {
    const state = rateLimiterState[key];
    if (!state) {
      return fallback(req, res, next);
    }

    state.count += 1;
    if (state.count > state.max) {
      return res.status(429).json({ error: messages[key] });
    }

    return next();
  };

  return {
    ...actual,
    bookOperationsLimiter: createTestLimiter('bookOperations', actual.bookOperationsLimiter),
    welcomeScreenLimiter: createTestLimiter('welcomeScreen', actual.welcomeScreenLimiter),
  };
});

const { createTestApp } = require('../setup/testServer');
const {
  createTestBook,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState,
} = require('../setup/securityTestState');

describe('Authentication & Security Integration', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    reapplyPrismaMocks();
    resetAuthState();
    resetRateLimiterState();
    setRateLimiterLimit('bookOperations', 5);
    setRateLimiterLimit('welcomeScreen', 5);
    await cleanupAllTestData();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('JWT validation', () => {
    test('allows authenticated users to access protected resources', async () => {
      setAuthState({ mode: 'valid', userId: 'secure-user' });
      await createTestBook('secure-user', { id: 'secure-book' });

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].id).toBe('secure-book');
    });

    test('rejects requests without Authorization header', async () => {
      setAuthState({ mode: 'missing' });

      const response = await request(app)
        .get('/api/books')
        .expect(401);

      expect(response.body.error).toContain('Authorization header');
    });

    test('rejects requests with invalid tokens', async () => {
      setAuthState({ mode: 'invalid' });

      const response = await request(app)
        .get('/api/books')
        .expect(401);

      expect(response.body.error).toBe('Invalid token signature');
    });

    test('rejects requests with expired tokens', async () => {
      setAuthState({ mode: 'expired' });

      const response = await request(app)
        .get('/api/books')
        .expect(401);

      expect(response.body.error).toBe('Token expired');
    });

    test('returns 401 when middleware passes through without auth payload', async () => {
      setAuthState({ mode: 'passthrough' });

      const response = await request(app)
        .get('/api/books')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });

  describe('Rate limiting', () => {
    test('enforces book operations rate limiter', async () => {
      setAuthState({ mode: 'valid', userId: 'rate-user' });
      await createTestBook('rate-user', { id: 'rate-book' });
      setRateLimiterLimit('bookOperations', 2);

      await request(app).get('/api/books').expect(200);
      await request(app).get('/api/books').expect(200);

      const response = await request(app)
        .get('/api/books')
        .expect(429);

      expect(response.body.error).toBe('Too many book operation requests, please try again after 15 minutes');
    });
  });

  describe('Security headers', () => {
    test('includes standard security and CORS headers on protected endpoints', async () => {
      setAuthState({ mode: 'valid', userId: 'header-user' });
      await createTestBook('header-user');

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Session management & token refresh', () => {
    test('scopes data to the current token and denies access after token change', async () => {
      const firstUserId = 'session-user-1';
      const secondUserId = 'session-user-2';

      const firstBook = await createTestBook(firstUserId);
      await createTestBook(secondUserId);

      setAuthState({ mode: 'valid', userId: firstUserId });
      const firstResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(firstResponse.body.books).toHaveLength(1);
      expect(firstResponse.body.books[0].id).toBe(firstBook.id);

      setAuthState({ mode: 'valid', userId: secondUserId });
      const secondResponse = await request(app)
        .get('/api/books')
        .expect(200);

      expect(secondResponse.body.books).toHaveLength(1);
      expect(secondResponse.body.books[0].userId).toBe(secondUserId);

      const forbiddenResponse = await request(app)
        .get(`/api/books/${firstBook.id}`)
        .expect(404);

      expect(forbiddenResponse.body.error).toBe('Book not found');
    });
  });

  describe('Input validation enforcement', () => {
    test('rejects invalid pagination values before hitting controllers', async () => {
      setAuthState({ mode: 'valid', userId: 'validation-user' });

      const response = await request(app)
        .get('/api/books')
        .query({ limit: -10, page: 'not-a-number' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });

  describe('SQL injection defenses', () => {
    test('treats malicious search queries as plain text', async () => {
      const userId = 'sql-user';
      setAuthState({ mode: 'valid', userId });
      await createTestBook(userId, { title: 'Legit Title' });
      await createTestBook('other-user', { title: 'Hidden Data' });

      const response = await request(app)
        .get('/api/books')
        .query({ search: `'; DROP TABLE books; --` })
        .expect(200);

      expect(response.body.books).toHaveLength(0);
    });
  });

  describe('XSS prevention', () => {
    test('strips script tags when updating metadata', async () => {
      const userId = 'xss-user';
      setAuthState({ mode: 'valid', userId });
      const book = await createTestBook(userId);

      const response = await request(app)
        .patch(`/api/books/${book.id}`)
        .send({ description: '<script>alert("xss")</script>Great read' })
        .expect(200);

      expect(response.body.book.description).toBe('alert("xss")Great read');
      expect(response.body.book.description).not.toContain('<script>');
    });
  });

  describe('CSRF protection', () => {
    test('denies state-changing requests without JWT context', async () => {
      setAuthState({ mode: 'passthrough' });

      const response = await request(app)
        .post('/api/user/update-name')
        .send({ name: 'CrossSiteAttempt' })
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });
});
