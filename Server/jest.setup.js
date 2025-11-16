// Jest setup file for global test configuration
require('dotenv').config({ path: '.env.test' });
jest.mock('epub', () => {
  const { EventEmitter } = require('events');

  return class MockEpub extends EventEmitter {
    constructor() {
      super();
      this.metadata = {};
      this.flow = [];
      this.toc = [];
      this.manifest = {};
      process.nextTick(() => this.emit('end'));
    }

    parse() {
      this.emit('end');
    }
  };
}, { virtual: true });

// Global test timeout
jest.setTimeout(10000);

// Mock process.exit to prevent tests from terminating
jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process.exit called with code: ${code}`);
});

// Mock Prisma Client to prevent actual database connections
// The mock uses jest.fn() which allows us to change return values in tests
const mockPrisma = {
  book: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `book-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn(async ({ where }) => ({ id: where.id })),
    count: jest.fn().mockResolvedValue(0),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  bookmark: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `bookmark-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn(async ({ where }) => ({ id: where.id })),
    upsert: jest.fn(async ({ create }) => ({ id: `bookmark-${Date.now()}`, ...create })),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  highlight: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `highlight-${Date.now()}`, color: '#ffff00', ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn(async ({ where }) => ({ id: where.id })),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  note: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `note-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn().mockResolvedValue({ id: 'deleted' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  collection: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `collection-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn().mockResolvedValue({ id: 'deleted' }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  readingSession: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(async ({ data }) => ({ id: `session-${Date.now()}`, ...data })),
  },
  readingGoal: {
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: `goal-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn(async ({ where }) => ({ id: where.id })),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn(async ({ data }) => ({ id: data.id || `user-${Date.now()}`, ...data })),
    update: jest.fn(async ({ where, data }) => ({ id: where.id, ...data })),
    delete: jest.fn(async ({ where }) => ({ id: where.id })),
    upsert: jest.fn(async ({ create, update, where }) => ({ id: where.id, ...(create || {}), ...(update || {}) })),
  },
  userProfile: {
    upsert: jest.fn(async ({ create }) => ({ ...create })),
  },
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn((fn) => fn(mockPrisma)),
};

// Export mockPrisma for tests to configure
global.mockPrisma = mockPrisma;

jest.mock('./config/database.js', () => mockPrisma);

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  // Keep native behaviour for error and warn
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress log, debug, info in tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Global test utilities
global.testUtils = {
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),
  
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.sendStatus = jest.fn().mockReturnValue(res);
    return res;
  },
  
  mockNext: () => jest.fn()
};
