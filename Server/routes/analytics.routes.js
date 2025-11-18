const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middleware/clerk-auth');
const { bookOperationsLimiter } = require('../middleware/rateLimiter');
const analyticsController = require('../controllers/analytics.controller');

// Log a reading session
router.post('/session', checkJwt, bookOperationsLimiter, analyticsController.logSession);

// Get reading statistics
router.get('/stats', checkJwt, bookOperationsLimiter, analyticsController.getStats);

// Get reading goals
router.get('/goals', checkJwt, bookOperationsLimiter, analyticsController.getGoals);

// Create or update a reading goal
router.post('/goals', checkJwt, bookOperationsLimiter, analyticsController.createGoal);

// Update goal progress
router.put('/goals/:id', checkJwt, bookOperationsLimiter, analyticsController.updateGoal);

// Delete a goal
router.delete('/goals/:id', checkJwt, bookOperationsLimiter, analyticsController.deleteGoal);

module.exports = router;
