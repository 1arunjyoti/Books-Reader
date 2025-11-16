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
  createTestHighlight,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  setRateLimiterLimit,
  resetRateLimiterState,
} = require('../setup/securityTestState');

describe('Highlights API Integration', () => {
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
    setAuthState({ mode: 'valid', userId: 'highlight-user' });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('POST /api/highlights', () => {
    test('creates EPUB highlight successfully', async () => {
      const book = await createTestBook('highlight-user');

      const response = await request(app)
        .post('/api/highlights')
        .send({
          bookId: book.id,
          text: 'Important fact',
          cfiRange: 'epubcfi(/6/2[chapter]!/4/2/6)',
          color: 'yellow',
          hex: '#ffff00',
        })
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          bookId: book.id,
          text: 'Important fact',
          color: 'yellow',
        })
      );
    });

    test('requires cfiRange for EPUB source', async () => {
      const book = await createTestBook('highlight-user');

      const response = await request(app)
        .post('/api/highlights')
        .send({
          bookId: book.id,
          text: 'Missing range',
          color: 'yellow',
          hex: '#ffff00',
        })
        .expect(400);

      expect(response.body.error).toContain('cfiRange is required');
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });
      const book = await createTestBook('highlight-user');

      await request(app)
        .post('/api/highlights')
        .send({
          bookId: book.id,
          text: 'Unauthorized',
          cfiRange: 'epubcfi(/6/2)',
          color: 'yellow',
          hex: '#ffff00',
        })
        .expect(401);
    });
  });

  describe('GET /api/highlights/:bookId', () => {
    test('returns highlights for the current user', async () => {
      const book = await createTestBook('highlight-user');
      await createTestHighlight(book.id, 'highlight-user', { text: 'First' });
      await createTestHighlight(book.id, 'highlight-user', { text: 'Second', color: 'green', hex: '#00ff00' });
      await createTestHighlight(book.id, 'other-user', { text: 'Not mine' });

      const response = await request(app)
        .get(`/api/highlights/${book.id}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((h) => h.text)).toEqual(expect.arrayContaining(['First', 'Second']));
    });
  });

  describe('GET /api/highlights/:bookId/stats', () => {
    test('returns stats grouped by color and notes', async () => {
      const book = await createTestBook('highlight-user');
      await createTestHighlight(book.id, 'highlight-user', { text: 'Yellow', color: 'yellow', hex: '#ffff00', note: 'note' });
      await createTestHighlight(book.id, 'highlight-user', { text: 'Blue', color: 'blue', hex: '#0000ff' });

      const response = await request(app)
        .get(`/api/highlights/${book.id}/stats`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          total: 2,
          byColor: expect.objectContaining({ yellow: 1, blue: 1 }),
        })
      );
    });
  });

  describe('GET /api/highlights/:bookId/search', () => {
    test('returns highlights matching query', async () => {
      const book = await createTestBook('highlight-user');
      await createTestHighlight(book.id, 'highlight-user', { text: 'Critical insight' });
      await createTestHighlight(book.id, 'highlight-user', { text: 'Other text' });

      const response = await request(app)
        .get(`/api/highlights/${book.id}/search`)
        .query({ q: 'Critical' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Critical insight');
    });
  });

  describe('GET /api/highlights/:bookId/filter', () => {
    test('filters highlights by color list', async () => {
      const book = await createTestBook('highlight-user');
      await createTestHighlight(book.id, 'highlight-user', { text: 'Yellow one', color: 'yellow', hex: '#ffff00' });
      await createTestHighlight(book.id, 'highlight-user', { text: 'Blue one', color: 'blue', hex: '#0000ff' });
      await createTestHighlight(book.id, 'highlight-user', { text: 'Green one', color: 'green', hex: '#00ff00' });

      const response = await request(app)
        .get(`/api/highlights/${book.id}/filter`)
        .query({ colors: 'yellow,blue' })
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.map((h) => h.color)).toEqual(expect.arrayContaining(['yellow', 'blue']));
    });
  });

  describe('PUT /api/highlights/:highlightId', () => {
    test('updates highlight attributes', async () => {
      const book = await createTestBook('highlight-user');
      const highlight = await createTestHighlight(book.id, 'highlight-user', { text: 'Needs update' });

      const response = await request(app)
        .put(`/api/highlights/${highlight.id}`)
        .send({ color: 'blue', hex: '#0000ff', note: 'Updated note' })
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({ color: 'blue', hex: '#0000ff', note: 'Updated note' })
      );
    });

    test('returns 404 when highlight belongs to another user', async () => {
      const book = await createTestBook('other-user');
      const highlight = await createTestHighlight(book.id, 'other-user');

      await request(app)
        .put(`/api/highlights/${highlight.id}`)
        .send({ color: 'blue', hex: '#0000ff' })
        .expect(404);
    });
  });

  describe('DELETE /api/highlights/:highlightId', () => {
    test('deletes highlight owned by user', async () => {
      const book = await createTestBook('highlight-user');
      const highlight = await createTestHighlight(book.id, 'highlight-user');

      const response = await request(app)
        .delete(`/api/highlights/${highlight.id}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ success: true }));
    });

    test('returns 404 for non-owned highlight', async () => {
      const book = await createTestBook('other-user');
      const highlight = await createTestHighlight(book.id, 'other-user');

      await request(app)
        .delete(`/api/highlights/${highlight.id}`)
        .expect(404);
    });
  });

  describe('DELETE /api/highlights/book/:bookId', () => {
    test('deletes all highlights for a book', async () => {
      const book = await createTestBook('highlight-user');
      await createTestHighlight(book.id, 'highlight-user');
      await createTestHighlight(book.id, 'highlight-user');

      const response = await request(app)
        .delete(`/api/highlights/book/${book.id}`)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ success: true, deletedCount: 2 }));
    });
  });

  describe('Rate limiting', () => {
    test('enforces highlight rate limiter', async () => {
      setRateLimiterLimit('bookOperations', 1);
      const book = await createTestBook('highlight-user');

      await request(app)
        .get(`/api/highlights/${book.id}`)
        .expect(200);

      const response = await request(app)
        .get(`/api/highlights/${book.id}`)
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
