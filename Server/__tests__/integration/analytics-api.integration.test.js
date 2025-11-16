const request = require('supertest');

jest.mock('../../middleware/auth', () => {
  const { authState } = require('../setup/securityTestState');

  return {
    checkJwt: (req, res, next) => {
      switch (authState.mode) {
        case 'valid':
          req.auth = { payload: { sub: authState.userId } };
          return next();
        case 'missing':
          return res.status(401).json({ error: 'Authorization header missing or invalid' });
        default:
          return res.status(401).json({ error: 'Unauthorized' });
      }
    },
  };
});

jest.mock('../../middleware/rateLimiter', () => {
  const actual = jest.requireActual('../../middleware/rateLimiter');
  const { rateLimiterState } = require('../setup/securityTestState');

  const createTestLimiter = (key, fallback) => (req, res, next) => {
    const state = rateLimiterState[key];
    if (!state) {
      return fallback(req, res, next);
    }

    state.count += 1;
    if (state.count > state.max) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    return next();
  };

  return {
    ...actual,
    bookOperationsLimiter: createTestLimiter('bookOperations', actual.bookOperationsLimiter),
  };
});

const { createTestApp } = require('../setup/testServer');
const {
  createTestBook,
  createTestReadingSession,
  createTestReadingGoal,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState,
} = require('../setup/securityTestState');

const analyticsService = require('../../services/analytics.service');
const prisma = require('../../config/database');

describe('Analytics API Integration', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    reapplyPrismaMocks();
    resetAuthState();
    resetRateLimiterState();
    setRateLimiterLimit('bookOperations', 100);
    await cleanupAllTestData();
    jest.clearAllMocks();
    setAuthState({ mode: 'valid', userId: 'analytics-user' });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('POST /api/analytics/session', () => {
    test('logs reading session successfully', async () => {
      const book = await createTestBook('analytics-user');
      const response = await request(app)
        .post('/api/analytics/session')
        .send({
          bookId: book.id,
          duration: 600,
          pagesRead: 15,
        })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          bookId: book.id,
          userId: 'analytics-user',
          duration: 600,
        })
      );
    });

    test('validates required fields', async () => {
      await request(app)
        .post('/api/analytics/session')
        .send({ duration: 100 })
        .expect(400);
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .post('/api/analytics/session')
        .send({ bookId: 'abc', duration: 50 })
        .expect(401);
    });
  });

  describe('GET /api/analytics/stats', () => {
    test('returns aggregate reading stats for period', async () => {
      const session = await createTestReadingSession('analytics-user', { duration: 1200, pagesRead: 30 });
      await createTestReadingSession('analytics-user', { duration: 600, pagesRead: 10, createdAt: new Date(Date.now() - 86400000) });
      await createTestReadingSession('other-user', { duration: 999 });

      const response = await request(app)
        .get('/api/analytics/stats')
        .query({ period: 'all' })
        .expect(200);

      expect(response.body.totalReadingTime).toBe(1800);
      expect(response.body.totalPagesRead).toBe(40);
      expect(Array.isArray(response.body.chartData)).toBe(true);
    });
  });

  describe('Goals APIs', () => {
    test('GET /goals returns user goals', async () => {
      await createTestReadingGoal('analytics-user', { type: 'pages', period: 'weekly', target: 50 });
      await createTestReadingGoal('other-user');

      const response = await request(app)
        .get('/api/analytics/goals')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].userId).toBe('analytics-user');
    });

    test('POST /goals creates or updates goal for period', async () => {
      const response = await request(app)
        .post('/api/analytics/goals')
        .send({ type: 'pages', period: 'weekly', target: 70 })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ userId: 'analytics-user', target: 70 }));

      const updateResponse = await request(app)
        .post('/api/analytics/goals')
        .send({ type: 'pages', period: 'weekly', target: 100 })
        .expect(200);

      expect(updateResponse.body.target).toBe(100);
    });

    test('PUT /goals/:id updates progress', async () => {
      const goal = await createTestReadingGoal('analytics-user', { target: 200, current: 10 });

      const response = await request(app)
        .put(`/api/analytics/goals/${goal.id}`)
        .send({ current: 50 })
        .expect(200);

      expect(response.body.current).toBe(50);
    });

    test('DELETE /goals/:id removes goal', async () => {
      const goal = await createTestReadingGoal('analytics-user');

      const response = await request(app)
        .delete(`/api/analytics/goals/${goal.id}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');
    });
  });

  describe('Goals error scenarios', () => {
    test('POST /goals rejects invalid period', async () => {
      await request(app)
        .post('/api/analytics/goals')
        .send({ type: 'pages', period: 'decade', target: 100 })
        .expect(400);
    });

    test('PUT /goals/:id returns 404 for other user goal', async () => {
      const goal = await createTestReadingGoal('other-user');

      await request(app)
        .put(`/api/analytics/goals/${goal.id}`)
        .send({ current: 10 })
        .expect(404);
    });

    test('DELETE /goals/:id returns 404 for other user goal', async () => {
      const goal = await createTestReadingGoal('other-user');

      await request(app)
        .delete(`/api/analytics/goals/${goal.id}`)
        .expect(404);
    });
  });

  describe('Rate limiting', () => {
    test('enforces analytics rate limiter', async () => {
      setRateLimiterLimit('bookOperations', 1);

      await request(app)
        .get('/api/analytics/stats')
        .expect(200);

      const response = await request(app)
        .get('/api/analytics/stats')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
