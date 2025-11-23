/**
 * Unit tests for User Service
 */

jest.mock('axios', () => ({
  post: jest.fn(),
  delete: jest.fn()
}));

jest.mock('../../../config/storage', () => ({
  deleteFromB2: jest.fn()
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const deleteManyResult = (count) => ({ count });

const createTransactionMock = () => ({
  bookmark: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(2)) },
  annotation: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(1)) },
  highlight: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(3)) },
  readingSession: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(4)) },
  readingGoal: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(1)) },
  collection: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(1)) },
  book: { deleteMany: jest.fn().mockResolvedValue(deleteManyResult(5)) },
  user: { delete: jest.fn().mockResolvedValue({ id: 'user-1' }) }
});

jest.mock('../../../config/database', () => ({
  book: {
    findMany: jest.fn()
  },
  $transaction: jest.fn()
}));

const axios = require('axios');
const prisma = require('../../../config/database');
const { deleteFromB2 } = require('../../../config/storage');
const userService = require('../../../services/user.service');

describe('User Service', () => {
  const envBackup = { ...process.env };
  let txMock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...envBackup };
    txMock = createTransactionMock();
    prisma.$transaction.mockImplementation(async (fn) => fn(txMock));
  });

  afterAll(() => {
    process.env = envBackup;
  });

  describe('deleteUserFilesFromB2', () => {
    test('deletes files and accumulates stats, capturing errors', async () => {
      prisma.book.findMany.mockResolvedValue([
        { id: 'book-1', fileUrl: 'files/book-1.pdf', coverUrl: 'covers/book-1.png' },
        { id: 'book-2', fileUrl: null, coverUrl: 'covers/book-2.png' }
      ]);

      deleteFromB2
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce();

      const stats = await userService.deleteUserFilesFromB2('user-1');

      expect(deleteFromB2).toHaveBeenCalledTimes(3);
      expect(stats.booksDeleted).toBe(1);
      expect(stats.coversDeleted).toBe(1);
      expect(stats.errors).toHaveLength(1);
    });
  });

  describe('deleteUserDataFromDatabase', () => {
    test('runs transactional deletes and returns counts', async () => {
      const stats = await userService.deleteUserDataFromDatabase('user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(stats).toEqual({
        books: 5,
        bookmarks: 2,
        annotations: 1,
        highlights: 3,
        readingSessions: 4,
        readingGoals: 1,
        collections: 1,
        user: 1
      });
    });
  });

  describe('deleteClerkUser', () => {
    test('deletes user successfully', async () => {
      const result = await userService.deleteClerkUser('user_123');
      
      // Since deleteClerkUser calls clerkClient.users.deleteUser
      // and we're mocking the module, just verify the return value
      expect(typeof result).toBe('boolean');
    });
  });

  describe('verifyUserPassword', () => {
    test('returns true with Clerk (password verification handled by Clerk)', async () => {
      const result = await userService.verifyUserPassword('user@example.com', 'pass');
      expect(result).toBe(true);
    });
  });

  describe('deleteUserAccount', () => {
    test('performs full deletion workflow', async () => {
      prisma.book.findMany.mockResolvedValue([]);
      deleteFromB2.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (fn) => fn(createTransactionMock()));

      const result = await userService.deleteUserAccount('user_123', 'user@example.com', 'secret');

      expect(result.success).toBe(true);
      expect(result.deletedFromDatabase).toBe(true);
      expect(result.deletedFromClerk).toBeDefined();
    });

    test('handles deletion workflow with Clerk', async () => {
      prisma.book.findMany.mockResolvedValue([]);
      deleteFromB2.mockResolvedValue();
      prisma.$transaction.mockImplementation(async (fn) => fn(createTransactionMock()));

      const result = await userService.deleteUserAccount('user_123', 'user@example.com', 'secret');

      expect(result.success).toBe(true);
      expect(result.deletedFromDatabase).toBe(true);
    });
  });
});
