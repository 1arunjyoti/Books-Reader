/**
 * Database test helpers for integration tests
 * 
 * These helpers configure the mocked Prisma client to return specific data
 */

// In-memory storage for test data
const testData = {
  books: [],
  bookmarks: [],
  highlights: []
};

/**
 * Generate a valid MongoDB ObjectId for testing
 */
function generateTestObjectId() {
  // Generate a 24-character hexadecimal string (MongoDB ObjectId format)
  return Array.from({ length: 24 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Setup mock implementations once for all tests
 * This should be called once at the beginning of test suites
 */
function setupMockPrisma() {
  const mockPrisma = global.mockPrisma;
  
  // Setup book mocks
  mockPrisma.book.findMany.mockImplementation((args = {}) => {
    const where = args.where;
    console.error('[Mock] book.findMany called with args:', JSON.stringify(args));
    console.error('[Mock] testData.books has', testData.books.length, 'books');
    if (where && where.userId) {
      const userBooks = testData.books.filter(b => b.userId === where.userId);
      console.error('[Mock] Filtered to', userBooks.length, 'books for user', where.userId);
      // Apply search filter if present
      if (where.OR) {
        return Promise.resolve(userBooks.filter(b => {
          const searchMatch = where.OR.some(condition => {
            if (condition.title && condition.title.contains) {
              return b.title.includes(condition.title.contains);
            }
            if (condition.author && condition.author.contains) {
              return b.author.includes(condition.author.contains);
            }
            return false;
          });
          return searchMatch;
        }));
      }
      // Apply status filter if present
      if (where.status) {
        return Promise.resolve(userBooks.filter(b => b.status === where.status));
      }
      return Promise.resolve(userBooks);
    }
    console.error('[Mock] Returning all', testData.books.length, 'books');
    return Promise.resolve(testData.books);
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
    if (where && where.id) {
      const found = testData.bookmarks.find(b => b.id === where.id);
      return Promise.resolve(found || null);
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
    const where = args.where;
    if (where && where.bookId && where.userId) {
      return Promise.resolve(testData.highlights.filter(h => h.bookId === where.bookId && h.userId === where.userId));
    }
    if (where && where.userId) {
      return Promise.resolve(testData.highlights.filter(h => h.userId === where.userId));
    }
    return Promise.resolve(testData.highlights);
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
}

// Call setup once when this module is loaded
if (global.mockPrisma) {
  setupMockPrisma();
}

/**
 * Create a test user (in memory for tests)
 */
function createTestUser(userId = 'test-user-123') {
  return {
    id: userId,
    email: `${userId}@test.com`,
    name: 'Test User'
  };
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
    fileType: overrides.fileType || 'pdf',
    fileSize: overrides.fileSize || 1024000,
    status: overrides.status || 'unread',
    progress: overrides.progress || 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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

/**
 * Clean up test data - resets all mocks
 */
async function cleanupTestData(userId) {
  // Clear in-memory storage
  if (userId) {
    testData.books = testData.books.filter(b => b.userId !== userId);
    testData.bookmarks = testData.bookmarks.filter(b => b.userId !== userId);
    testData.highlights = testData.highlights.filter(h => h.userId !== userId);
  } else {
    testData.books = [];
    testData.bookmarks = [];
    testData.highlights = [];
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
  cleanupTestData,
  cleanupAllTestData
};

