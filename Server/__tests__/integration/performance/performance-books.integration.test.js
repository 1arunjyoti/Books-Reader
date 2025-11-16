const request = require('supertest');
const { performance } = require('node:perf_hooks');

const { createTestApp } = require('../../setup/testServer');
const {
  createTestBook,
  cleanupAllTestData,
  reapplyPrismaMocks,
} = require('../../setup/dbHelpers');
const {
  setAuthState,
  resetAuthState,
  resetRateLimiterState,
  setRateLimiterLimit,
} = require('../../setup/securityTestState');
const { resetStats, getStats } = require('../../../middleware/responseTimeMonitor');

jest.mock('../../../middleware/auth', () => {
  const { authState } = require('../../setup/securityTestState');

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

jest.mock('../../../middleware/rateLimiter', () => {
  const actual = jest.requireActual('../../../middleware/rateLimiter');
  const { rateLimiterState } = require('../../setup/securityTestState');

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

jest.setTimeout(30000);

describe('Performance Testing · Books API', () => {
  const PERF_USER = 'perf-test-user';
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    reapplyPrismaMocks();
    resetStats();
    resetAuthState();
    resetRateLimiterState();
    setRateLimiterLimit('bookOperations', 10_000);
    setAuthState({ mode: 'valid', userId: PERF_USER });
    await cleanupAllTestData();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupAllTestData();
  });

  async function seedBooks(count = 50) {
    for (let i = 0; i < count; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await createTestBook(PERF_USER, { title: `Performance Book #${i}` });
    }
  }

  async function runConcurrentBatch(batchSize) {
    const tasks = Array.from({ length: batchSize }).map(async () => {
      const start = performance.now();
      const response = await request(app)
        .get('/api/books')
        .expect(200);
      const duration = performance.now() - start;
      return { duration, bookCount: response.body.books.length };
    });

    return Promise.all(tasks);
  }

  function calculatePercentile(values, percentile = 0.95) {
    if (!values.length) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.max(0, Math.floor(sorted.length * percentile) - 1);
    return sorted[index];
  }

  test('maintains acceptable response time under load', async () => {
    await seedBooks(60);

    const batches = 5;
    const concurrency = 10;
    const durations = [];

    for (let i = 0; i < batches; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const results = await runConcurrentBatch(concurrency);
      durations.push(...results.map((result) => result.duration));
    }

    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const percentile95 = calculatePercentile(durations, 0.95);

    const stats = getStats();
    const avgFromMonitor = parseFloat(stats.summary.avgDuration);

    expect(averageDuration).toBeLessThan(250);
    expect(percentile95).toBeLessThan(450);
    expect(avgFromMonitor).toBeLessThan(250);
    expect(stats.summary.slowRequests).toBe(0);
  });

  test('handles high concurrency without errors or excessive DB calls', async () => {
    await seedBooks(40);

    const concurrency = 30;
    const results = await runConcurrentBatch(concurrency);

    results.forEach(({ bookCount }) => {
      expect(bookCount).toBeGreaterThan(0);
    });

    expect(global.mockPrisma.book.findMany).toHaveBeenCalledTimes(concurrency);
  });

  test('does not leak memory across request bursts', async () => {
    await seedBooks(30);

    const startHeap = process.memoryUsage().heapUsed;
    const bursts = 4;
    const concurrency = 15;

    for (let i = 0; i < bursts; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await runConcurrentBatch(concurrency);
    }

    const endHeap = process.memoryUsage().heapUsed;
    const deltaMb = (endHeap - startHeap) / (1024 * 1024);

    expect(deltaMb).toBeLessThan(20);
  });
});
