/**
 * Database test helpers for integration tests
 * 
 * These helpers configure the mocked Prisma client to return specific data
 */

const { randomUUID } = require('crypto');

// In-memory storage for test data
const testData = {
  books: [],
  bookmarks: [],
  highlights: [],
  collections: [],
  readingSessions: [],
  readingGoals: [],
  users: [],
};

/**
 * Generate a valid UUID for testing
 */
function generateTestObjectId() {
  return randomUUID();
}

/**
 * Setup mock implementations once for all tests
 * This should be called once at the beginning of test suites
 */
function setupMockPrisma() {
  const mockPrisma = global.mockPrisma;
  
  // Setup book mocks
  mockPrisma.book.findMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    let results = [...testData.books];

    if (where.userId) {
      results = results.filter(b => b.userId === where.userId);
    }

    if (where.id?.in && Array.isArray(where.id.in)) {
      results = results.filter(b => where.id.in.includes(b.id));
    }

    if (where.OR) {
      results = results.filter(b => {
        return where.OR.some(condition => {
          if (condition.title?.contains && b.title?.includes(condition.title.contains)) {
            return true;
          }
          if (condition.author?.contains && b.author?.includes(condition.author.contains)) {
            return true;
          }
          return false;
        });
      });
    }

    if (where.status) {
      results = results.filter(b => b.status === where.status);
    }

    return Promise.resolve(results);
  });
  
  mockPrisma.book.findFirst.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.id && where.userId) {
      const found = testData.books.find(b => b.id === where.id && b.userId === where.userId);
      return Promise.resolve(found || null);
    }
    if (where && where.userId) {
      const found = testData.books.find(b => b.userId === where.userId);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(testData.books[0] || null);
  });
  
  mockPrisma.book.findUnique.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.id) {
      const found = testData.books.find(b => b.id === where.id);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(null);
  });
  
  mockPrisma.book.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.books.findIndex(b => b.id === where.id);
    if (index !== -1) {
      const deleted = testData.books.splice(index, 1)[0];
      return Promise.resolve(deleted);
    }
    throw new Error('Book not found');
  });
  
  mockPrisma.book.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const book = testData.books.find(b => b.id === where.id);
    if (book) {
      Object.assign(book, data, { updatedAt: new Date() });
      return Promise.resolve(book);
    }
    throw new Error('Book not found');
  });
  
  mockPrisma.book.create.mockImplementation((args = {}) => {
    const data = args.data;
    const newBook = {
      id: generateTestObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    testData.books.push(newBook);
    return Promise.resolve(newBook);
  });
  
  // Setup bookmark mocks
  mockPrisma.bookmark.findMany.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.bookId && where.userId) {
      return Promise.resolve(testData.bookmarks.filter(b => b.bookId === where.bookId && b.userId === where.userId));
    }
    if (where && where.userId) {
      return Promise.resolve(testData.bookmarks.filter(b => b.userId === where.userId));
    }
    return Promise.resolve(testData.bookmarks);
  });
  
  mockPrisma.bookmark.findFirst.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.id && where.userId) {
      const found = testData.bookmarks.find(b => b.id === where.id && b.userId === where.userId);
      return Promise.resolve(found || null);
    }
    if (where && where.bookId && where.userId) {
      const found = testData.bookmarks.find(b => b.bookId === where.bookId && b.userId === where.userId);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(testData.bookmarks[0] || null);
  });
  
  mockPrisma.bookmark.findUnique.mockImplementation((args = {}) => {
    const where = args.where;
    if (where) {
      if (where.id) {
        const found = testData.bookmarks.find(b => b.id === where.id);
        return Promise.resolve(found || null);
      }
      if (where.bookId_userId_pageNumber) {
        const { bookId, userId, pageNumber } = where.bookId_userId_pageNumber;
        const found = testData.bookmarks.find(
          (b) => b.bookId === bookId && b.userId === userId && b.pageNumber === pageNumber
        );
        return Promise.resolve(found || null);
      }
    }
    return Promise.resolve(null);
  });
  
  mockPrisma.bookmark.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.bookmarks.findIndex(b => b.id === where.id);
    if (index !== -1) {
      const deleted = testData.bookmarks.splice(index, 1)[0];
      return Promise.resolve(deleted);
    }
    throw new Error('Bookmark not found');
  });
  
  mockPrisma.bookmark.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const bookmark = testData.bookmarks.find(b => b.id === where.id);
    if (bookmark) {
      Object.assign(bookmark, data, { updatedAt: new Date() });
      return Promise.resolve(bookmark);
    }
    throw new Error('Bookmark not found');
  });
  
  mockPrisma.bookmark.create.mockImplementation((args = {}) => {
    const data = args.data;
    const newBookmark = {
      id: generateTestObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    testData.bookmarks.push(newBookmark);
    return Promise.resolve(newBookmark);
  });
  
  // Setup highlight mocks
  mockPrisma.highlight.findMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    let results = [...testData.highlights];

    if (where.bookId) {
      results = results.filter(h => h.bookId === where.bookId);
    }

    if (where.userId) {
      results = results.filter(h => h.userId === where.userId);
    }

    if (where.color) {
      if (Array.isArray(where.color.in)) {
        results = results.filter(h => where.color.in.includes(h.color));
      } else if (where.color === h.color) {
        results = results.filter(h => h.color === where.color);
      }
    }

    if (where.text?.contains) {
      const query = where.text.contains.toLowerCase();
      results = results.filter(h => (h.text || '').toLowerCase().includes(query));
    }

    return Promise.resolve(results);
  });
  
  mockPrisma.highlight.findFirst.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.id && where.userId) {
      const found = testData.highlights.find(h => h.id === where.id && h.userId === where.userId);
      return Promise.resolve(found || null);
    }
    if (where && where.bookId && where.userId) {
      const found = testData.highlights.find(h => h.bookId === where.bookId && h.userId === where.userId);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(testData.highlights[0] || null);
  });
  
  mockPrisma.highlight.findUnique.mockImplementation((args = {}) => {
    const where = args.where;
    if (where && where.id) {
      const found = testData.highlights.find(h => h.id === where.id);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(null);
  });
  
  mockPrisma.highlight.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.highlights.findIndex(h => h.id === where.id);
    if (index !== -1) {
      const deleted = testData.highlights.splice(index, 1)[0];
      return Promise.resolve(deleted);
    }
    throw new Error('Highlight not found');
  });

  mockPrisma.highlight.deleteMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    const beforeCount = testData.highlights.length;
    testData.highlights = testData.highlights.filter(h => {
      if (where.bookId && h.bookId !== where.bookId) {
        return true;
      }
      if (where.userId && h.userId !== where.userId) {
        return true;
      }
      return false;
    });
    const deletedCount = beforeCount - testData.highlights.length;
    return Promise.resolve({ count: deletedCount });
  });
  
  mockPrisma.highlight.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const highlight = testData.highlights.find(h => h.id === where.id);
    if (highlight) {
      Object.assign(highlight, data, { updatedAt: new Date() });
      return Promise.resolve(highlight);
    }
    throw new Error('Highlight not found');
  });
  
  mockPrisma.highlight.create.mockImplementation((args = {}) => {
    const data = args.data;
    const newHighlight = {
      id: generateTestObjectId(),
      color: 'yellow', // default color
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    testData.highlights.push(newHighlight);
    return Promise.resolve(newHighlight);
  });

  // Setup collection mocks
  const matchesWhere = (collection, where = {}) => {
    if (where.userId && collection.userId !== where.userId) {
      return false;
    }
    if (where.name && collection.name !== where.name.trim()) {
      return false;
    }
    if (where.id) {
      if (typeof where.id === 'object' && where.id.not) {
        if (collection.id === where.id.not) {
          return false;
        }
      } else if (collection.id !== where.id) {
        return false;
      }
    }
    if (where.isDefault !== undefined && collection.isDefault !== where.isDefault) {
      return false;
    }
    return true;
  };

  mockPrisma.collection.findMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    let results = [...testData.collections];
    if (where.userId) {
      results = results.filter(c => c.userId === where.userId);
    }
    return Promise.resolve(results);
  });

  mockPrisma.collection.findFirst.mockImplementation((args = {}) => {
    const where = args.where || {};
    const found = testData.collections.find(collection => matchesWhere(collection, where));
    return Promise.resolve(found || null);
  });

  mockPrisma.collection.findUnique.mockImplementation((args = {}) => {
    const where = args.where || {};
    if (where.id) {
      const found = testData.collections.find(c => c.id === where.id);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(null);
  });

  mockPrisma.collection.create.mockImplementation((args = {}) => {
    const data = args.data;
    const newCollection = {
      id: data.id || generateTestObjectId(),
      name: data.name || 'Collection',
      description: data.description || null,
      color: data.color || '#3b82f6',
      icon: data.icon || 'folder',
      bookIds: data.bookIds || [],
      isDefault: data.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    testData.collections.push(newCollection);
    return Promise.resolve(newCollection);
  });

  mockPrisma.collection.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const collection = testData.collections.find(c => c.id === where.id);
    if (!collection) {
      throw new Error('Collection not found');
    }
    Object.assign(collection, data, { updatedAt: new Date() });
    return Promise.resolve(collection);
  });

  mockPrisma.collection.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.collections.findIndex(c => c.id === where.id);
    if (index === -1) {
      throw new Error('Collection not found');
    }
    const deleted = testData.collections.splice(index, 1)[0];
    return Promise.resolve(deleted);
  });

  // Setup user mocks
  mockPrisma.user.findUnique.mockImplementation((args = {}) => {
    const where = args.where || {};
    if (where.id) {
      const found = testData.users.find((u) => u.id === where.id);
      return Promise.resolve(found || null);
    }
    if (where.email) {
      const found = testData.users.find((u) => u.email === where.email);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(null);
  });

  mockPrisma.user.create.mockImplementation((args = {}) => {
    const data = args.data;
    const user = {
      id: data.id || generateTestObjectId(),
      email: data.email || `${generateTestObjectId()}@test.com`,
      name: data.name || 'Test User',
      welcomeShown: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    testData.users.push(user);
    return Promise.resolve(user);
  });

  const applyUserUpdate = (target, data = {}) => {
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        target[key] = data[key];
      }
    });
    target.updatedAt = new Date();
    return target;
  };

  const applySelect = (source, select) => {
    if (!select || typeof select !== 'object') {
      return { ...source };
    }
    return Object.entries(select).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = source[key];
      }
      return acc;
    }, {});
  };

  mockPrisma.user.upsert.mockImplementation((args = {}) => {
    const {
      where = {},
      create: createData = {},
      update: updateData = {},
      select,
    } = args;

    let user = testData.users.find((u) => u.id === where.id);

    if (user) {
      user = applyUserUpdate(user, updateData);
    } else {
      const newUser = {
        id: createData.id || where.id || generateTestObjectId(),
        email: createData.email || `${generateTestObjectId()}@test.com`,
        name: createData.name || 'Test User',
        welcomeShown: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...createData,
      };
      testData.users.push(newUser);
      user = newUser;
    }

    const result = applySelect(user, select);
    return Promise.resolve(result);
  });

  mockPrisma.user.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const user = testData.users.find((u) => u.id === where.id);
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(user, data, { updatedAt: new Date() });
    return Promise.resolve(user);
  });

  mockPrisma.user.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.users.findIndex((u) => u.id === where.id);
    if (index === -1) {
      throw new Error('User not found');
    }
    const deleted = testData.users.splice(index, 1)[0];
    return Promise.resolve(deleted);
  });

  mockPrisma.userProfile = {
    upsert: jest.fn(async ({ create, update, where }) => {
      let profile = testData.users.find((u) => u.id === where.userId);
      if (!profile) {
        profile = { id: where.userId, ...create };
        testData.users.push(profile);
      } else {
        Object.assign(profile, update);
      }
      return profile;
    })
  };

  // Setup reading session mocks
  mockPrisma.readingSession.create.mockImplementation((args = {}) => {
    const data = args.data;
    const session = {
      id: data.id || generateTestObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    testData.readingSessions.push(session);
    return Promise.resolve(session);
  });

  mockPrisma.readingSession.findMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    let results = [...testData.readingSessions];
    if (where.userId) {
      results = results.filter((s) => s.userId === where.userId);
    }
    if (where.createdAt?.gte) {
      const gte = new Date(where.createdAt.gte);
      results = results.filter((s) => new Date(s.createdAt) >= gte);
    }
    return Promise.resolve(results);
  });

  // Setup reading goal mocks
  mockPrisma.readingGoal.findMany.mockImplementation((args = {}) => {
    const where = args.where || {};
    let results = [...testData.readingGoals];
    if (where.userId) {
      results = results.filter((g) => g.userId === where.userId);
    }
    return Promise.resolve(results);
  });

  mockPrisma.readingGoal.findFirst.mockImplementation((args = {}) => {
    const where = args.where || {};
    const found = testData.readingGoals.find((goal) => {
      if (where.userId && goal.userId !== where.userId) {
        return false;
      }
      if (where.type && goal.type !== where.type) {
        return false;
      }
      if (where.period && goal.period !== where.period) {
        return false;
      }
      if (where.year !== undefined && goal.year !== where.year) {
        return false;
      }
      if (where.month !== undefined && goal.month !== where.month) {
        return false;
      }
      if (where.week !== undefined && goal.week !== where.week) {
        return false;
      }
      return true;
    });
    return Promise.resolve(found || null);
  });

  mockPrisma.readingGoal.findUnique.mockImplementation((args = {}) => {
    const where = args.where || {};
    if (where.id) {
      const found = testData.readingGoals.find((g) => g.id === where.id);
      return Promise.resolve(found || null);
    }
    return Promise.resolve(null);
  });

  mockPrisma.readingGoal.create.mockImplementation((args = {}) => {
    const data = args.data;
    const goal = {
      id: data.id || generateTestObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      current: data.current || 0,
      ...data,
    };
    testData.readingGoals.push(goal);
    return Promise.resolve(goal);
  });

  mockPrisma.readingGoal.update.mockImplementation((args = {}) => {
    const { where, data } = args;
    const goal = testData.readingGoals.find((g) => g.id === where.id);
    if (!goal) {
      throw new Error('Goal not found');
    }
    Object.assign(goal, data, { updatedAt: new Date() });
    return Promise.resolve(goal);
  });

  mockPrisma.readingGoal.delete.mockImplementation((args = {}) => {
    const where = args.where;
    const index = testData.readingGoals.findIndex((g) => g.id === where.id);
    if (index === -1) {
      throw new Error('Goal not found');
    }
    const deleted = testData.readingGoals.splice(index, 1)[0];
    return Promise.resolve(deleted);
  });
}

// Call setup once when this module is loaded
if (global.mockPrisma) {
  setupMockPrisma();
}

/**
 * Create a test user (in memory for tests)
 */
function createTestUser(userId = 'test-user-123', overrides = {}) {
  const user = {
    id: userId,
    email: overrides.email || `${userId}@test.com`,
    name: overrides.name || 'Test User',
    picture: overrides.picture || null,
    nickname: overrides.nickname || '',
    welcomeShown: overrides.welcomeShown || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  testData.users.push(user);

  return user;
}

/**
 * Create a test book record by mocking Prisma return values
 */
async function createTestBook(userId, overrides = {}) {
  const book = {
    id: overrides.id || generateTestObjectId(),
    userId,
    title: overrides.title || 'Test Book',
    author: overrides.author || 'Test Author',
    fileKey: overrides.fileKey || `books/${userId}/test-book.pdf`,
    fileUrl: overrides.fileUrl || overrides.fileKey || `files/${userId}/test-book.pdf`,
    fileName: overrides.fileName || overrides.fileUrl || overrides.fileKey || `files/${userId}/test-book.pdf`,
    fileType: overrides.fileType || 'pdf',
    fileSize: overrides.fileSize || 1024000,
    status: overrides.status || 'unread',
    progress: overrides.progress || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    coverUrl: overrides.coverUrl || null,
    ...overrides
  };
  
  // Add to in-memory storage
  testData.books.push(book);
  
  return book;
}

/**
 * Create a test bookmark by mocking Prisma return values
 */
async function createTestBookmark(bookId, userId, overrides = {}) {
  const bookmark = {
    id: overrides.id || generateTestObjectId(),
    bookId,
    userId,
    pageNumber: overrides.pageNumber || 1,
    cfi: overrides.cfi || null,
    note: overrides.note || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  
  // Add to in-memory storage
  testData.bookmarks.push(bookmark);
  
  return bookmark;
}

/**
 * Create a test highlight by mocking Prisma return values
 */
async function createTestHighlight(bookId, userId, overrides = {}) {
  const highlight = {
    id: overrides.id || generateTestObjectId(),
    bookId,
    userId,
    text: overrides.text || 'Highlighted text',
    color: overrides.color || 'yellow',
    hex: overrides.hex || '#ffff00',
    pageNumber: overrides.pageNumber || null,
    cfiRange: overrides.cfiRange || null,
    note: overrides.note || null,
    source: overrides.source || 'EPUB',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  
  // Add to in-memory storage
  testData.highlights.push(highlight);
  
  return highlight;
}

async function createTestCollection(userId, overrides = {}) {
  const collection = {
    id: overrides.id || generateTestObjectId(),
    userId,
    name: overrides.name || 'My Collection',
    description: overrides.description || null,
    color: overrides.color || '#3b82f6',
    icon: overrides.icon || 'folder',
    bookIds: overrides.bookIds || [],
    isDefault: overrides.isDefault || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  testData.collections.push(collection);

  return collection;
}

async function createTestReadingSession(userId, overrides = {}) {
  const session = {
    id: overrides.id || generateTestObjectId(),
    userId,
    bookId: overrides.bookId || generateTestObjectId(),
    duration: overrides.duration || 600,
    pagesRead: overrides.pagesRead || 10,
    startPage: overrides.startPage || 1,
    endPage: overrides.endPage || 10,
    progressDelta: overrides.progressDelta || 5,
    createdAt: overrides.createdAt ? new Date(overrides.createdAt) : new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  testData.readingSessions.push(session);

  return session;
}

async function createTestReadingGoal(userId, overrides = {}) {
  const goal = {
    id: overrides.id || generateTestObjectId(),
    userId,
    type: overrides.type || 'pages',
    period: overrides.period || 'weekly',
    target: overrides.target || 100,
    current: overrides.current || 0,
    year: overrides.year || new Date().getFullYear(),
    month: overrides.month || null,
    week: overrides.week || null,
    endDate: overrides.endDate || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  testData.readingGoals.push(goal);

  return goal;
}

/**
 * Clean up test data - resets all mocks
 */
async function cleanupTestData(userId) {
  // Clear in-memory storage
  if (userId) {
    testData.books = testData.books.filter(b => b.userId !== userId);
    testData.bookmarks = testData.bookmarks.filter(b => b.userId !== userId);
    testData.highlights = testData.highlights.filter(h => h.userId !== userId);
    testData.collections = testData.collections.filter(c => c.userId !== userId);
    testData.readingSessions = testData.readingSessions.filter(s => s.userId !== userId);
    testData.readingGoals = testData.readingGoals.filter(g => g.userId !== userId);
    testData.users = testData.users.filter(u => u.id !== userId);
  } else {
    testData.books = [];
    testData.bookmarks = [];
    testData.highlights = [];
    testData.collections = [];
    testData.readingSessions = [];
    testData.readingGoals = [];
    testData.users = [];
  }
  
  // Don't reset mock implementations - they are set up by setupMockPrisma()
  // The mocks already reference testData arrays and will automatically see changes
  
  return Promise.resolve();
}

/**
 * Clean up all test data
 */
async function cleanupAllTestData() {
  return cleanupTestData();
}

/**
 * Reapply Prisma mock implementations
 * Useful when Jest resetMocks clears custom implementations between tests
 */
function reapplyPrismaMocks() {
  if (global.mockPrisma) {
    setupMockPrisma();
  }
}

// Setup mocks when module is loaded
if (global.mockPrisma) {
  console.error('[dbHelpers] Setting up mock Prisma implementations');
  setupMockPrisma();
  console.error('[dbHelpers] Mock Prisma setup complete');
} else {
  console.error('[dbHelpers] WARNING: global.mockPrisma not found!');
}

module.exports = {
  generateTestObjectId,
  createTestUser,
  createTestBook,
  createTestBookmark,
  createTestHighlight,
  createTestCollection,
  createTestReadingSession,
  createTestReadingGoal,
  cleanupTestData,
  cleanupAllTestData,
  reapplyPrismaMocks
};

