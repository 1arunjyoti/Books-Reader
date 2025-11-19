const request = require('supertest');

jest.mock('../../services/upload.service', () => ({
  processFileUpload: jest.fn(),
  processUrlUpload: jest.fn(),
}));

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
    uploadLimiter: createTestLimiter('upload', actual.uploadLimiter),
  };
});

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

const uploadService = require('../../services/upload.service');
const { createTestApp } = require('../setup/testServer');
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

const defaultFile = () => ({
  buffer: Buffer.from('PDF data'),
  originalname: 'sample.pdf',
  mimetype: 'application/pdf',
  size: 2048,
});

describe('Uploads API Integration', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    resetAuthState();
    resetRateLimiterState();
    resetUploadFileState();
    setAuthState({ mode: 'valid', userId: 'upload-user' });
    setRateLimiterLimit('upload', 100);
    jest.clearAllMocks();

    setUploadFileState({ file: defaultFile() });

    uploadService.processFileUpload.mockResolvedValue({
      success: true,
      book: { id: 'book-upload', title: 'Uploaded Book' },
    });
    uploadService.processUrlUpload.mockResolvedValue({
      success: true,
      book: { id: 'book-url', title: 'URL Book' },
    });
  });

  describe('POST /api/upload', () => {
    test('uploads file successfully for authenticated user', async () => {
      const file = {
        buffer: Buffer.from('PDF data'),
        originalname: 'awesome.pdf',
        mimetype: 'application/pdf',
        size: 4096,
      };
      setUploadFileState({ file });

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'awesome.pdf')
        .expect(200);

      expect(uploadService.processFileUpload).toHaveBeenCalledWith(
        file.buffer,
        file.originalname,
        file.size,
        'upload-user'
      );
      expect(response.body).toEqual(
        expect.objectContaining({ success: true, book: expect.objectContaining({ id: 'book-upload' }) })
      );
    });

    test('returns 400 when file is missing', async () => {
      setUploadFileState({ shouldAttach: false });

      await request(app)
        .post('/api/upload')
        .expect(400);

      expect(uploadService.processFileUpload).not.toHaveBeenCalled();
    });

    test('handles invalid file types', async () => {
      uploadService.processFileUpload.mockRejectedValueOnce(new Error('Invalid file type. Only PDF files are allowed.'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'bad.exe')
        .expect(400);

      expect(response.body.error).toBe('Invalid file type. Only PDF files are allowed.');
    });

    test('handles file size limit errors', async () => {
      uploadService.processFileUpload.mockRejectedValueOnce(new Error('File size exceeds 100MB limit'));

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'huge.pdf')
        .expect(400);

      expect(response.body.error).toBe('File size exceeds 100MB limit');
    });

    test('enforces upload rate limiting', async () => {
      setRateLimiterLimit('upload', 1);

      await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'first.pdf')
        .expect(200);

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'second.pdf')
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });

    test('requires authentication', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('ignored'), 'auth.pdf')
        .expect(401);

      expect(uploadService.processFileUpload).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/upload/from-url', () => {
    test('uploads file from URL successfully', async () => {
      const response = await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'https://example.com/book.pdf' })
        .expect(200);

      expect(uploadService.processUrlUpload).toHaveBeenCalledWith('https://example.com/book.pdf', 'upload-user');
      expect(response.body).toEqual(
        expect.objectContaining({ success: true, book: expect.objectContaining({ id: 'book-url' }) })
      );
    });

    test('validates URL parameter', async () => {
      await request(app)
        .post('/api/upload/from-url')
        .send({})
        .expect(400);

      expect(uploadService.processUrlUpload).not.toHaveBeenCalled();
    });

    test('handles URL processing errors', async () => {
      uploadService.processUrlUpload.mockRejectedValueOnce(new Error('Invalid URL format'));

      const response = await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'notaurl' })
        .expect(400);

      expect(response.body.error).toBe('Invalid URL format');
    });

    test('propagates timeout errors as 408', async () => {
      uploadService.processUrlUpload.mockRejectedValueOnce(new Error('Request timeout - file download took too long'));

      const response = await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'https://slow.example.com/book.pdf' })
        .expect(408);

      expect(response.body.error).toContain('timeout');
    });

    test('rejects non-http protocols to prevent SSRF', async () => {
      uploadService.processUrlUpload.mockRejectedValueOnce(new Error('Invalid URL protocol. Only HTTP and HTTPS are allowed.'));

      const response = await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'ftp://internal.example.com/book.pdf' })
        .expect(400);

      expect(response.body.error).toContain('Invalid URL protocol');
    });

    test('requires authentication for URL uploads', async () => {
      setAuthState({ mode: 'missing' });

      await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'https://example.com/book.pdf' })
        .expect(401);

      expect(uploadService.processUrlUpload).not.toHaveBeenCalled();
    });

    test('enforces upload rate limits on URL uploads', async () => {
      setRateLimiterLimit('upload', 1);

      await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'https://example.com/book.pdf' })
        .expect(200);

      const response = await request(app)
        .post('/api/upload/from-url')
        .send({ url: 'https://example.com/book.pdf' })
        .expect(429);

      expect(response.body.error).toBe('Rate limit exceeded');
    });
  });
});
