/**
 * Unit tests for Analytics Controller
 */
const analyticsController = require('../../../controllers/analytics.controller');
const analyticsService = require('../../../services/analytics.service');
const logger = require('../../../utils/logger');

jest.mock('../../../services/analytics.service');
jest.mock('../../../utils/logger');

describe('AnalyticsController', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      auth: {
        userId: 'user-123'
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('logSession', () => {
    test('should log session for authenticated user', async () => {
      const sessionData = { bookId: 'book-1', duration: 120 };
      req.body = sessionData;
      const mockSession = { id: 'session-1', ...sessionData };
      analyticsService.logSession = jest.fn().mockResolvedValue(mockSession);

      await analyticsController.logSession(req, res);

      expect(analyticsService.logSession).toHaveBeenCalledWith('user-123', sessionData);
      expect(res.json).toHaveBeenCalledWith(mockSession);
    });

    test('should return 401 when user id missing', async () => {
      req.auth = null;

      await analyticsController.logSession(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 when required fields missing', async () => {
      req.body = { duration: 30 };

      await analyticsController.logSession(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'bookId and duration are required' });
      expect(analyticsService.logSession).not.toHaveBeenCalled();
    });

    test('should handle service errors', async () => {
      req.body = { bookId: 'book-1', duration: 60 };
      analyticsService.logSession = jest.fn().mockRejectedValue(new Error('DB error'));

      await analyticsController.logSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to log reading session' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    test('should return stats with provided period', async () => {
      req.query = { period: 'month' };
      const stats = { totalReadingTime: 3600 };
      analyticsService.getStatistics = jest.fn().mockResolvedValue(stats);

      await analyticsController.getStats(req, res);

      expect(analyticsService.getStatistics).toHaveBeenCalledWith('user-123', 'month');
      expect(res.json).toHaveBeenCalledWith(stats);
    });

    test('should default period to all when not provided', async () => {
      const stats = { totalPagesRead: 100 };
      analyticsService.getStatistics = jest.fn().mockResolvedValue(stats);

      await analyticsController.getStats(req, res);

      expect(analyticsService.getStatistics).toHaveBeenCalledWith('user-123', 'all');
      expect(res.json).toHaveBeenCalledWith(stats);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await analyticsController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should handle service errors', async () => {
      analyticsService.getStatistics = jest.fn().mockRejectedValue(new Error('Failed'));

      await analyticsController.getStats(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch analytics' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getGoals', () => {
    test('should fetch goals for authenticated user', async () => {
      const goals = [{ id: 'goal-1' }];
      analyticsService.getGoals = jest.fn().mockResolvedValue(goals);

      await analyticsController.getGoals(req, res);

      expect(analyticsService.getGoals).toHaveBeenCalledWith('user-123');
      expect(res.json).toHaveBeenCalledWith(goals);
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await analyticsController.getGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should handle service errors', async () => {
      analyticsService.getGoals = jest.fn().mockRejectedValue(new Error('DB issue'));

      await analyticsController.getGoals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch goals' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createGoal', () => {
    test('should create or update goal', async () => {
      req.body = { type: 'pages', period: 'weekly', target: 100 };
      const goal = { id: 'goal-1' };
      analyticsService.createOrUpdateGoal = jest.fn().mockResolvedValue(goal);

      await analyticsController.createGoal(req, res);

      expect(analyticsService.createOrUpdateGoal).toHaveBeenCalledWith('user-123', req.body);
      expect(res.json).toHaveBeenCalledWith(goal);
    });

    test('should return 401 when user not authenticated', async () => {
      req.auth = null;

      await analyticsController.createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 400 when required fields missing', async () => {
      req.body = { type: 'pages' };

      await analyticsController.createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'type, period, and target are required' });
      expect(analyticsService.createOrUpdateGoal).not.toHaveBeenCalled();
    });

    test('should return 400 when service throws invalid period', async () => {
      req.body = { type: 'pages', period: 'invalid', target: 10 };
      analyticsService.createOrUpdateGoal = jest.fn().mockRejectedValue(new Error('Invalid period'));

      await analyticsController.createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid period' });
    });

    test('should handle other errors with 500', async () => {
      req.body = { type: 'pages', period: 'weekly', target: 50 };
      analyticsService.createOrUpdateGoal = jest.fn().mockRejectedValue(new Error('DB down'));

      await analyticsController.createGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to save goal' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateGoal', () => {
    test('should update goal progress', async () => {
      req.params.id = 'goal-1';
      req.body = { current: 20 };
      const updatedGoal = { id: 'goal-1', current: 20 };
      analyticsService.updateGoalProgress = jest.fn().mockResolvedValue(updatedGoal);

      await analyticsController.updateGoal(req, res);

      expect(analyticsService.updateGoalProgress).toHaveBeenCalledWith('goal-1', 'user-123', 20);
      expect(res.json).toHaveBeenCalledWith(updatedGoal);
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await analyticsController.updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when goal not found', async () => {
      req.params.id = 'missing';
      req.body = { current: 50 };
      analyticsService.updateGoalProgress = jest.fn().mockRejectedValue(new Error('Goal not found'));

      await analyticsController.updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Goal not found' });
    });

    test('should handle other errors', async () => {
      req.params.id = 'goal-1';
      req.body = { current: 10 };
      analyticsService.updateGoalProgress = jest.fn().mockRejectedValue(new Error('DB error'));

      await analyticsController.updateGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update goal' });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('deleteGoal', () => {
    test('should delete goal successfully', async () => {
      req.params.id = 'goal-1';
      analyticsService.deleteGoal = jest.fn().mockResolvedValue();

      await analyticsController.deleteGoal(req, res);

      expect(analyticsService.deleteGoal).toHaveBeenCalledWith('goal-1', 'user-123');
      expect(res.json).toHaveBeenCalledWith({ message: 'Goal deleted successfully' });
    });

    test('should return 401 when unauthenticated', async () => {
      req.auth = null;

      await analyticsController.deleteGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    test('should return 404 when goal not found', async () => {
      req.params.id = 'goal-404';
      analyticsService.deleteGoal = jest.fn().mockRejectedValue(new Error('Goal not found'));

      await analyticsController.deleteGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Goal not found' });
    });

    test('should handle other errors', async () => {
      req.params.id = 'goal-1';
      analyticsService.deleteGoal = jest.fn().mockRejectedValue(new Error('DB error'));

      await analyticsController.deleteGoal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete goal' });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
