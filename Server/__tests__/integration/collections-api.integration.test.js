const request = require('supertest');

jest.mock('../../middleware/auth', () => {
  const { authState } = require('../setup/securityTestState');

  return {
    checkJwt: (req, res, next) => {
      switch (authState.mode) {
        case 'valid':
          req.auth = { userId: authState.userId };
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

jest.mock('../../config/storage', () => {
  const actual = jest.requireActual('../../config/storage');
  return {
    ...actual,
    generatePresignedUrl: jest.fn(async () => 'https://storage.example.com/mock-cover'),
  };
});

const storage = require('../../config/storage');
const { createTestApp } = require('../setup/testServer');
const {
  createTestBook,
  createTestCollection,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState,
} = require('../setup/securityTestState');

describe('Collections API Integration', () => {
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
    storage.generatePresignedUrl.mockResolvedValue('https://storage.example.com/mock-cover');
    setAuthState({ mode: 'valid', userId: 'collection-user' });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/collections', () => {
    test('returns user collections only', async () => {
      await createTestCollection('collection-user', { name: 'Sci-Fi' });
      await createTestCollection('collection-user', { name: 'Fantasy' });
      await createTestCollection('someone-else', { name: 'Other' });

      const response = await request(app)
        .get('/api/collections')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((c) => c.name)).toEqual(expect.arrayContaining(['Sci-Fi', 'Fantasy']));
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .get('/api/collections')
        .expect(401);
    });
  });

  describe('POST /api/collections', () => {
    test('creates a collection with trimmed name', async () => {
      const response = await request(app)
        .post('/api/collections')
        .send({ name: '  Favorites  ', description: 'Read soon' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          name: 'Favorites',
          description: 'Read soon',
          userId: 'collection-user',
        })
      );
    });

    test('rejects duplicate names', async () => {
      await createTestCollection('collection-user', { name: 'Favorites' });

      const response = await request(app)
        .post('/api/collections')
        .send({ name: 'Favorites' })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    test('validates required name', async () => {
      await request(app)
        .post('/api/collections')
        .send({})
        .expect(400);
    });

    test('rejects unauthenticated creation attempts', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .post('/api/collections')
        .send({ name: 'Hidden Ops' })
        .expect(401);
    });
  });

  describe('PATCH /api/collections/:id', () => {
    test('updates collection fields', async () => {
      const collection = await createTestCollection('collection-user', { name: 'Old Name' });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .send({ name: 'New Name', color: '#ff0000' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ name: 'New Name', color: '#ff0000' }));
    });

    test('rejects duplicate name on update', async () => {
      await createTestCollection('collection-user', { id: 'a', name: 'Main' });
      const collection = await createTestCollection('collection-user', { name: 'Secondary' });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .send({ name: 'Main' })
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    test('returns 404 for other user collection', async () => {
      const collection = await createTestCollection('another-user');

      await request(app)
        .patch(`/api/collections/${collection.id}`)
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /api/collections/:id', () => {
    test('deletes non-default collection', async () => {
      const collection = await createTestCollection('collection-user', { isDefault: false });

      const response = await request(app)
        .delete(`/api/collections/${collection.id}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');
    });

    test('prevents deleting default collection', async () => {
      const collection = await createTestCollection('collection-user', { isDefault: true });

      const response = await request(app)
        .delete(`/api/collections/${collection.id}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot delete default');
    });
  });

  describe('POST /api/collections/:id/books', () => {
    test('adds user books to collection', async () => {
      const bookA = await createTestBook('collection-user');
      const bookB = await createTestBook('collection-user');
      const collection = await createTestCollection('collection-user', { bookIds: [bookA.id] });

      const response = await request(app)
        .post(`/api/collections/${collection.id}/books`)
        .send({ bookIds: [bookB.id] })
        .expect(200);

      expect(response.body.bookIds).toEqual(expect.arrayContaining([bookA.id, bookB.id]));
    });

    test('requires non-empty bookIds array', async () => {
      const collection = await createTestCollection('collection-user');

      await request(app)
        .post(`/api/collections/${collection.id}/books`)
        .send({ bookIds: [] })
        .expect(400);
    });

    test('rejects books not owned by user', async () => {
      const otherBook = await createTestBook('other-user');
      const collection = await createTestCollection('collection-user');

      const response = await request(app)
        .post(`/api/collections/${collection.id}/books`)
        .send({ bookIds: [otherBook.id] })
        .expect(400);

      expect(response.body.error).toContain('do not belong');
    });
  });

  describe('DELETE /api/collections/:id/books', () => {
    test('removes specified books from collection', async () => {
      const bookA = await createTestBook('collection-user');
      const bookB = await createTestBook('collection-user');
      const collection = await createTestCollection('collection-user', { bookIds: [bookA.id, bookB.id] });

      const response = await request(app)
        .delete(`/api/collections/${collection.id}/books`)
        .send({ bookIds: [bookA.id] })
        .expect(200);

      expect(response.body.bookIds).toEqual([bookB.id]);
    });
  });

  describe('GET /api/collections/:id/books', () => {
    test('returns books within a collection', async () => {
      const book = await createTestBook('collection-user', { coverUrl: 'covers/book.png' });
      const collection = await createTestCollection('collection-user', { bookIds: [book.id] });

      const response = await request(app)
        .get(`/api/collections/${collection.id}/books`)
        .expect(200);

      expect(storage.generatePresignedUrl).toHaveBeenCalled();
      expect(response.body.books).toHaveLength(1);
      expect(response.body.collection.id).toBe(collection.id);
    });

    test('does not leak other user collections', async () => {
      const collection = await createTestCollection('victim-user');
      setAuthState({ mode: 'valid', userId: 'intruder-user' });

      await request(app)
        .get(`/api/collections/${collection.id}/books`)
        .expect(404);
    });
  });

  describe('Rate limiting', () => {
    test('enforces collection rate limiter', async () => {
      setRateLimiterLimit('bookOperations', 1);

      await request(app)
        .get('/api/collections')
        .expect(200);

      const response = await request(app)
        .get('/api/collections')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
