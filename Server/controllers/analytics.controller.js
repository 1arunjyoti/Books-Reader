const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * Analytics Controller
 * Handles HTTP requests/responses for reading analytics
 * Business logic delegated to analytics.service.js
 */

/**
 * Log a reading session
 */
exports.logSession = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { bookId, duration } = req.body;

    if (!bookId || duration === undefined) {
      return res.status(400).json({ error: 'bookId and duration are required' });
    }

    const session = await analyticsService.logSession(userId, req.body);
    res.json(session);
    
  } catch (error) {
    logger.error('Error creating reading session:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to log reading session' });
  }
};

/**
 * Get reading statistics
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { period = 'all' } = req.query;

    const stats = await analyticsService.getStatistics(userId, period);
    res.json(stats);
    
  } catch (error) {
    logger.error('Error fetching analytics:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Get reading goals
 */
exports.getGoals = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const goals = await analyticsService.getGoals(userId);
    res.json(goals);
    
  } catch (error) {
    logger.error('Error fetching goals:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
};

/**
 * Create or update a reading goal
 */
exports.createGoal = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, period, target } = req.body;

    if (!type || !period || !target) {
      return res.status(400).json({ error: 'type, period, and target are required' });
    }

    const goal = await analyticsService.createOrUpdateGoal(userId, req.body);
    res.json(goal);
    
  } catch (error) {
    logger.error('Error creating/updating goal:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Invalid period') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to save goal' });
  }
};

/**
 * Update goal progress
 */
exports.updateGoal = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { current } = req.body;

    const updatedGoal = await analyticsService.updateGoalProgress(id, userId, current);
    res.json(updatedGoal);
    
  } catch (error) {
    logger.error('Error updating goal:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update goal' });
  }
};

/**
 * Delete a goal
 */
exports.deleteGoal = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await analyticsService.deleteGoal(id, userId);
    res.json({ message: 'Goal deleted successfully' });
    
  } catch (error) {
    logger.error('Error deleting goal:', { error: error.message, stack: error.stack });
    
    if (error.message === 'Goal not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to delete goal' });
  }
};
