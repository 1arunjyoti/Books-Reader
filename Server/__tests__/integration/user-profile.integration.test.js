const request = require('supertest');
const { createTestApp } = require('../setup/testServer');
const {
  createTestUser,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  resetRateLimiterState,
  setRateLimiterLimit,
} = require('../setup/securityTestState');

jest.mock('../../middleware/auth', () => {
  const { authState } = require('../setup/securityTestState');

  return {
    checkJwt: (req, res, next) => {
      switch (authState.mode) {
        case 'valid':
          req.auth = {
            userId: authState.userId,
          };
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
    welcomeScreenLimiter: createTestLimiter('welcomeScreen', actual.welcomeScreenLimiter),
  };
});

jest.mock('axios');
const axios = require('axios');
axios.post = jest.fn();
axios.get = jest.fn();

const prisma = require('../../config/database');
const storage = require('../../config/storage');

jest.mock('../../config/storage', () => ({
  ...jest.requireActual('../../config/storage'),
  deleteFromB2: jest.fn(async () => ({ success: true })),
}));

const userService = require('../../services/user.service');

describe('User Profile API Integration', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    reapplyPrismaMocks();
    resetAuthState();
    resetRateLimiterState();
    setRateLimiterLimit('bookOperations', 100);
    setRateLimiterLimit('welcomeScreen', 100);
    await cleanupAllTestData();
    jest.clearAllMocks();
    setAuthState({ mode: 'valid', userId: 'user-profile', email: 'user@example.com', name: 'Test User' });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/user/profile', () => {
    test('returns requested profile fields and creates user if missing', async () => {
      await createTestUser('user-profile', { email: 'user@example.com', name: 'Test User' });
      const response = await request(app)
        .get('/api/user/profile')
        .query({ fields: 'name,email' })
        .expect(200);

      expect(response.body.user).toEqual(expect.objectContaining({ name: 'Test User', email: 'user@example.com' }));
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .get('/api/user/profile')
        .expect(401);
    });
  });

  describe('POST /api/user/update-name', () => {
    test('updates user name', async () => {
      await createTestUser('user-profile');

      const response = await request(app)
        .post('/api/user/update-name')
        .send({ name: 'New Name' })
        .expect(200);

      expect(response.body.user.name).toBe('New Name');
    });

    test('validates name input', async () => {
      await createTestUser('user-profile');

      await request(app)
        .post('/api/user/update-name')
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('POST /api/user/sync', () => {
    test('creates user if missing and returns profile', async () => {
      axios.post.mockResolvedValue({ data: { access_token: 'token' } });
      axios.get = jest.fn().mockResolvedValue({ data: { email: 'fetched@example.com' } });

      const response = await request(app)
        .post('/api/user/sync')
        .set('Authorization', 'Bearer access-token')
        .expect(200);

      expect(response.body.user.email).toBeDefined();
    });
  });

  describe('POST /api/user/delete', () => {
    test('validates required fields', async () => {
      await request(app)
        .post('/api/user/delete')
        .send({})
        .expect(400);
    });

    test('deletes account successfully when credentials provided', async () => {
      await createTestUser('user-profile', { email: 'user@example.com' });
      axios.post.mockResolvedValueOnce({ data: { access_token: 'mgmt-token' } }) // management token
        .mockResolvedValueOnce({ data: { access_token: 'password-token' } }); // password verify

      const response = await request(app)
        .post('/api/user/delete')
        .send({ email: 'user@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.message).toContain('Account deleted successfully');
    });
  });

  describe('Welcome status endpoints', () => {
    test('GET /welcome-status returns flag', async () => {
      await createTestUser('user-profile');

      const response = await request(app)
        .get('/api/user/welcome-status')
        .expect(200);

      expect(response.body).toHaveProperty('welcomeShown');
    });

    test('POST /welcome-shown marks flag as true', async () => {
      await createTestUser('user-profile');

      const response = await request(app)
        .post('/api/user/welcome-shown')
        .expect(200);

      expect(response.body.welcomeShown).toBe(true);
    });
  });

  describe('Rate limiting', () => {
    test('limits welcome status checks', async () => {
      setRateLimiterLimit('welcomeScreen', 1);
      await request(app).get('/api/user/welcome-status').expect(200);

      const response = await request(app)
        .get('/api/user/welcome-status')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
