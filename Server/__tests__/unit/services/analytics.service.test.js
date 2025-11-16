/**
 * Unit tests for Analytics Service
 */

jest.mock('../../../config/database', () => ({
  readingSession: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  book: {
    findMany: jest.fn()
  },
  readingGoal: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const analyticsService = require('../../../services/analytics.service');
const prisma = require('../../../config/database');
const logger = require('../../../utils/logger');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logSession', () => {
    test('creates a reading session with default values', async () => {
      const mockSession = { id: 'session-1', duration: 120 };
      prisma.readingSession.create.mockResolvedValue(mockSession);

      const result = await analyticsService.logSession('user-1', {
        bookId: 'book-1',
        duration: 120,
        pagesRead: undefined,
        startPage: undefined,
        endPage: undefined
      });

      expect(prisma.readingSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          bookId: 'book-1',
          userId: 'user-1',
          duration: 120,
          pagesRead: 0,
          startPage: 0,
          endPage: 0,
          progressDelta: 0
        })
      });
      expect(logger.info).toHaveBeenCalledWith('Reading session logged', expect.any(Object));
      expect(result).toBe(mockSession);
    });
  });

  describe('calculateDateFilter', () => {
    test('returns empty object for all period', () => {
      expect(analyticsService.calculateDateFilter('all')).toEqual({});
    });

    test('returns gte date for week period', () => {
      const result = analyticsService.calculateDateFilter('week');
      expect(result.gte).toBeInstanceOf(Date);
    });
  });

  describe('calculateStreak', () => {
    test('calculates streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sessions = [
        { createdAt: today.toISOString() },
        { createdAt: yesterday.toISOString() }
      ];

      const result = analyticsService.calculateStreak(sessions);
      expect(result).toBeGreaterThanOrEqual(2);
    });
  });

  describe('groupSessionsByDate', () => {
    test('groups duration and pages per date', () => {
      const sessions = [
        { createdAt: '2023-01-01T00:00:00Z', duration: 120, pagesRead: 10 },
        { createdAt: '2023-01-01T01:00:00Z', duration: 60, pagesRead: 5 }
      ];

      const result = analyticsService.groupSessionsByDate(sessions);
      expect(result).toEqual([
        { date: '2023-01-01', minutes: 3, pages: 15 }
      ]);
    });
  });

  describe('getStatistics', () => {
    test('returns aggregated statistics and chart data', async () => {
      const sessions = [
        { duration: 600, pagesRead: 20, createdAt: new Date().toISOString() },
        { duration: 300, pagesRead: 10, createdAt: new Date().toISOString() }
      ];
      const books = [
        { status: 'finished', progress: 100 },
        { status: 'reading', progress: 50 }
      ];

      prisma.readingSession.findMany
        .mockResolvedValueOnce(sessions)
        .mockResolvedValueOnce(sessions);
      prisma.book.findMany.mockResolvedValue(books);

      const result = await analyticsService.getStatistics('user-1', 'all');

      expect(prisma.readingSession.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.book.findMany).toHaveBeenCalled();
      expect(result).toMatchObject({
        totalReadingTime: 900,
        totalPagesRead: 30,
        booksFinished: 1,
        booksReading: 1,
        period: 'all'
      });
      expect(result.chartData.length).toBeGreaterThan(0);
    });
  });

  describe('getGoals', () => {
    test('returns goals for user', async () => {
      const goals = [{ id: 'goal-1' }];
      prisma.readingGoal.findMany.mockResolvedValue(goals);

      const result = await analyticsService.getGoals('user-1');
      expect(result).toBe(goals);
      expect(logger.debug).toHaveBeenCalledWith('Goals fetched', expect.any(Object));
    });
  });

  describe('createOrUpdateGoal', () => {
    test('creates goal when none exists', async () => {
      prisma.readingGoal.findFirst.mockResolvedValue(null);
      prisma.readingGoal.create.mockResolvedValue({ id: 'goal-1' });

      const result = await analyticsService.createOrUpdateGoal('user-1', {
        type: 'pages',
        period: 'weekly',
        target: 100
      });

      expect(prisma.readingGoal.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 'goal-1' });
    });

    test('updates goal when existing found', async () => {
      prisma.readingGoal.findFirst.mockResolvedValue({ id: 'goal-1' });
      prisma.readingGoal.update.mockResolvedValue({ id: 'goal-1', target: 200 });

      const result = await analyticsService.createOrUpdateGoal('user-1', {
        type: 'pages',
        period: 'weekly',
        target: 200
      });

      expect(prisma.readingGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { target: 200 }
      });
      expect(result).toEqual({ id: 'goal-1', target: 200 });
    });

    test('throws for invalid period', async () => {
      await expect(
        analyticsService.createOrUpdateGoal('user-1', {
          type: 'pages',
          period: 'invalid',
          target: 10
        })
      ).rejects.toThrow('Invalid period');
    });
  });

  describe('updateGoalProgress', () => {
    test('updates goal after ownership verification', async () => {
      prisma.readingGoal.findUnique.mockResolvedValue({ id: 'goal-1', userId: 'user-1' });
      prisma.readingGoal.update.mockResolvedValue({ id: 'goal-1', current: 50 });

      const result = await analyticsService.updateGoalProgress('goal-1', 'user-1', 50);

      expect(prisma.readingGoal.update).toHaveBeenCalledWith({
        where: { id: 'goal-1' },
        data: { current: 50 }
      });
      expect(result).toEqual({ id: 'goal-1', current: 50 });
    });

    test('throws when goal not found', async () => {
      prisma.readingGoal.findUnique.mockResolvedValue(null);

      await expect(
        analyticsService.updateGoalProgress('goal-404', 'user-1', 10)
      ).rejects.toThrow('Goal not found');
    });
  });

  describe('deleteGoal', () => {
    test('deletes goal after verifying ownership', async () => {
      prisma.readingGoal.findUnique.mockResolvedValue({ id: 'goal-1', userId: 'user-1' });
      prisma.readingGoal.delete.mockResolvedValue();

      await analyticsService.deleteGoal('goal-1', 'user-1');

      expect(prisma.readingGoal.delete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
    });
  });
});
