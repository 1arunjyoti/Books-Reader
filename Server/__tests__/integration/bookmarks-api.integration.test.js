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

const { createTestApp } = require('../setup/testServer');
const {
  createTestBook,
  createTestBookmark,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState,
} = require('../setup/securityTestState');

describe('Bookmarks API Integration', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    reapplyPrismaMocks();
    resetAuthState();
    resetRateLimiterState();
    setRateLimiterLimit('bookOperations', 100);
    setAuthState({ mode: 'valid', userId: 'bookmark-user' });
    await cleanupAllTestData();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('POST /api/bookmarks', () => {
    test('creates a bookmark for the user book', async () => {
      const book = await createTestBook('bookmark-user');

      const response = await request(app)
        .post('/api/bookmarks')
        .send({
          bookId: book.id,
          pageNumber: 10,
          note: 'Remember this page',
        })
        .expect(201);

      expect(response.body.bookmark).toEqual(
        expect.objectContaining({
          bookId: book.id,
          userId: 'bookmark-user',
          pageNumber: 10,
          note: 'Remember this page',
        })
      );
    });

    test('prevents duplicate bookmarks on same page', async () => {
      const book = await createTestBook('bookmark-user');
      await createTestBookmark(book.id, 'bookmark-user', { pageNumber: 5 });

      const response = await request(app)
        .post('/api/bookmarks')
        .send({ bookId: book.id, pageNumber: 5 })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    test('validates required fields', async () => {
      await request(app)
        .post('/api/bookmarks')
        .send({ pageNumber: 1 })
        .expect(400);
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .post('/api/bookmarks')
        .send({ bookId: '123', pageNumber: 1 })
        .expect(401);
    });
  });

  describe('GET /api/bookmarks/:bookId', () => {
    test('lists bookmarks for user book', async () => {
      const book = await createTestBook('bookmark-user');
      await createTestBookmark(book.id, 'bookmark-user', { pageNumber: 2 });
      await createTestBookmark(book.id, 'bookmark-user', { pageNumber: 5, note: 'note' });
      await createTestBookmark(book.id, 'other-user', { pageNumber: 8 });

      const response = await request(app)
        .get(`/api/bookmarks/${book.id}`)
        .expect(200);

      expect(response.body.bookmarks).toHaveLength(2);
      expect(response.body.bookmarks.map((b) => b.pageNumber)).toEqual([2, 5]);
    });
  });

  describe('PATCH /api/bookmarks/:id', () => {
    test('updates bookmark note', async () => {
      const book = await createTestBook('bookmark-user');
      const bookmark = await createTestBookmark(book.id, 'bookmark-user', { note: 'old' });

      const response = await request(app)
        .patch(`/api/bookmarks/${bookmark.id}`)
        .send({ note: 'updated note' })
        .expect(200);

      expect(response.body.bookmark.note).toBe('updated note');
    });

    test('returns 404 when bookmark belongs to another user', async () => {
      const book = await createTestBook('other-user');
      const bookmark = await createTestBookmark(book.id, 'other-user');

      await request(app)
        .patch(`/api/bookmarks/${bookmark.id}`)
        .send({ note: 'nope' })
        .expect(404);
    });
  });

  describe('DELETE /api/bookmarks/:id', () => {
    test('deletes bookmark owned by user', async () => {
      const book = await createTestBook('bookmark-user');
      const bookmark = await createTestBookmark(book.id, 'bookmark-user');

      const response = await request(app)
        .delete(`/api/bookmarks/${bookmark.id}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ success: true }));
    });

    test('returns 404 for non-owned bookmark', async () => {
      const book = await createTestBook('other-user');
      const bookmark = await createTestBookmark(book.id, 'other-user');

      await request(app)
        .delete(`/api/bookmarks/${bookmark.id}`)
        .expect(404);
    });
  });

  describe('Rate limiting', () => {
    test('enforces bookmark rate limiter', async () => {
      setRateLimiterLimit('bookOperations', 1);
      const book = await createTestBook('bookmark-user');

      await request(app)
        .get(`/api/bookmarks/${book.id}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/bookmarks/${book.id}`)
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
