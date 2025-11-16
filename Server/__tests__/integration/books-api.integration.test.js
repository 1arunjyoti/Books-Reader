const request = require('supertest');
const { randomUUID } = require('crypto');

jest.mock('../../config/storage', () => ({
  uploadToB2: jest.fn(async () => ({
    success: true,
    fileUrl: 'storage/mock/file.png',
  })),
  generatePresignedUrl: jest.fn(async () => 'https://storage.example.com/mock-presigned'),
  deleteFromB2: jest.fn(async () => ({ success: true })),
}));

const storage = require('../../config/storage');
const booksService = require('../../services/books.service');

jest.mock('../../middleware/upload', () => {
  const { uploadFileState } = require('../setup/uploadTestState');

  return {
    upload: {
      single: () => (req, res, next) => {
        if (uploadFileState.shouldAttach) {
          req.file = uploadFileState.file;
        }
        next();
      },
    },
  };
});

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
    }
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
    coverGenerationLimiter: createTestLimiter('bookOperations', actual.coverGenerationLimiter),
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
const {
  setUploadFileState,
  resetUploadFileState,
} = require('../setup/uploadTestState');

describe('Books API Integration Tests', () => {
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
    resetUploadFileState();
    storage.generatePresignedUrl.mockResolvedValue('https://storage.example.com/mock-presigned');
    storage.uploadToB2.mockResolvedValue({ success: true, fileUrl: 'storage/mock/file.png' });
    storage.deleteFromB2.mockResolvedValue({ success: true });
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  describe('GET /api/books', () => {
    test('returns books for authenticated user', async () => {
      setAuthState({ mode: 'valid', userId: 'books-user' });
      await createTestBook('books-user', { title: 'Alpha Story' });
      await createTestBook('books-user', { title: 'Beta Story' });

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.books).toHaveLength(2);
      expect(response.body.books.map((b) => b.userId)).toEqual(['books-user', 'books-user']);
    });

    test('applies search filter', async () => {
      setAuthState({ mode: 'valid', userId: 'search-user' });
      await createTestBook('search-user', { title: 'Readable Book' });
      await createTestBook('search-user', { title: 'Hidden Gems' });

      const response = await request(app)
        .get('/api/books')
        .query({ search: 'Readable' })
        .expect(200);

      expect(response.body.books).toHaveLength(1);
      expect(response.body.books[0].title).toContain('Readable');
    });

    test('returns empty list when user has no books', async () => {
      setAuthState({ mode: 'valid', userId: 'empty-user' });

      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.books).toEqual([]);
    });

    test('rejects invalid pagination parameters', async () => {
      setAuthState({ mode: 'valid', userId: 'books-user' });

      await request(app)
        .get('/api/books')
        .query({ limit: -5 })
        .expect(400);
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .get('/api/books')
        .expect(401);
    });
  });

  describe('GET /api/books/:id', () => {
    test('returns a single book when owned by user', async () => {
      setAuthState({ mode: 'valid', userId: 'owner-user' });
      const book = await createTestBook('owner-user', { title: 'Owned Book' });

      const response = await request(app)
        .get(`/api/books/${book.id}`)
        .expect(200);

      expect(response.body.book.id).toBe(book.id);
      expect(response.body.book.title).toBe('Owned Book');
    });

    test('returns 404 when requesting another users book', async () => {
      setAuthState({ mode: 'valid', userId: 'user-a' });
      const book = await createTestBook('user-b', { title: 'Foreign Book' });

      await request(app)
        .get(`/api/books/${book.id}`)
        .expect(404);
    });

    test('rejects invalid UUID params', async () => {
      setAuthState({ mode: 'valid', userId: 'user-a' });

      await request(app)
        .get('/api/books/not-a-uuid')
        .expect(400);
    });
  });

  describe('GET /api/books/:id/presigned-url', () => {
    test('returns presigned URL and caching headers', async () => {
      setAuthState({ mode: 'valid', userId: 'url-user' });
      const book = await createTestBook('url-user', {
        fileUrl: 'files/url-user/test.pdf',
      });

      const response = await request(app)
        .get(`/api/books/${book.id}/presigned-url`)
        .query({ expiresIn: 5400 })
        .expect(200);

      process.stdout.write(`Presigned response body: ${JSON.stringify(response.body)}\n`);
      expect(storage.generatePresignedUrl).toHaveBeenCalledWith('files/url-user/test.pdf', 5400);
      expect(response.body.presignedUrl).toEqual('https://storage.example.com/mock-presigned');
      expect(response.headers['cache-control']).toContain('max-age=1800');
    });

    test('returns 404 for non-owned book', async () => {
      setAuthState({ mode: 'valid', userId: 'presigned-requester' });
      const book = await createTestBook('other-user', {
        fileUrl: 'files/other/test.pdf'
      });

      await request(app)
        .get(`/api/books/${book.id}/presigned-url`)
        .expect(404);
    });
  });

  describe('PATCH /api/books/:id', () => {
    test('updates book metadata', async () => {
      setAuthState({ mode: 'valid', userId: 'edit-user' });
      const book = await createTestBook('edit-user', { title: 'Old Title' });

      const response = await request(app)
        .patch(`/api/books/${book.id}`)
        .send({ title: 'New Title', status: 'reading' })
        .expect(200);

      expect(response.body.book.title).toBe('New Title');
      expect(response.body.book.status).toBe('reading');
    });

    test('enforces validation rules', async () => {
      setAuthState({ mode: 'valid', userId: 'edit-user' });
      const book = await createTestBook('edit-user');

      await request(app)
        .patch(`/api/books/${book.id}`)
        .send({ progress: 150 })
        .expect(400);
    });

    test('returns 404 when updating another user book', async () => {
      setAuthState({ mode: 'valid', userId: 'user-a' });
      const book = await createTestBook('user-b');

      await request(app)
        .patch(`/api/books/${book.id}`)
        .send({ title: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /api/books/:id', () => {
    test('deletes owned book and cascades storage clean-up', async () => {
      setAuthState({ mode: 'valid', userId: 'delete-user' });
      const book = await createTestBook('delete-user', {
        fileUrl: 'files/delete/book.pdf',
        coverUrl: 'covers/delete/cover.png',
      });

      const response = await request(app)
        .delete(`/api/books/${book.id}`)
        .expect(200);

      expect(response.body).toMatchObject({ success: true });
      expect(storage.deleteFromB2).toHaveBeenCalledWith('files/delete/book.pdf');
      expect(storage.deleteFromB2).toHaveBeenCalledWith('covers/delete/cover.png');
    });

    test('returns 404 when deleting unknown book', async () => {
      setAuthState({ mode: 'valid', userId: 'delete-user' });

      await request(app)
        .delete(`/api/books/${randomUUID()}`)
        .expect(404);
    });
  });

  describe('POST /api/books/:id/cover', () => {
    test('requires a file upload', async () => {
      setAuthState({ mode: 'valid', userId: 'cover-user' });
      const book = await createTestBook('cover-user');
      setUploadFileState({ shouldAttach: false });

      const response = await request(app)
        .post(`/api/books/${book.id}/cover`)
        .expect(400);

      expect(response.body.error).toBe('No cover image uploaded');
      resetUploadFileState();
    });

    test('uploads cover image successfully', async () => {
      setAuthState({ mode: 'valid', userId: 'cover-user' });
      const book = await createTestBook('cover-user');
      const spy = jest.spyOn(booksService, 'uploadCoverImage').mockResolvedValue({
        success: true,
        coverUrl: 'covers/mock/cover.png',
        book: { id: book.id, coverUrl: 'covers/mock/cover.png' },
      });

      const response = await request(app)
        .post(`/api/books/${book.id}/cover`)
        .attach('cover', Buffer.from('fake-cover'), { filename: 'cover.png', contentType: 'image/png' })
        .expect(200);

      expect(spy).toHaveBeenCalled();
      expect(response.body.coverUrl).toBe('covers/mock/cover.png');

      spy.mockRestore();
    });
  });

  describe('POST /api/books/:id/generate-cover', () => {
    test('delegates to generateBookCover service', async () => {
      setAuthState({ mode: 'valid', userId: 'gen-user' });
      const book = await createTestBook('gen-user');
      const spy = jest.spyOn(booksService, 'generateBookCover').mockResolvedValue({
        success: true,
        message: 'started',
      });

      const response = await request(app)
        .post(`/api/books/${book.id}/generate-cover`)
        .expect(200);

      expect(spy).toHaveBeenCalledWith(book.id, 'gen-user');
      expect(response.body.success).toBe(true);

      spy.mockRestore();
    });
  });
});
