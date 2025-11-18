const express = require('express');
const { checkJwt } = require('../middleware/clerk-auth');
const { validateBody } = require('../middleware/validator');
const { bookOperationsLimiter, welcomeScreenLimiter } = require('../middleware/rateLimiter');
const { z } = require('zod');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Validation schemas
// Optimized limit: 25 characters for performance and UX
const updateUserNameSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(25, 'Name is too long (max 25 characters)')
    .trim(),
});

const deleteAccountSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', checkJwt, userController.getUserProfile);

/**
 * POST /api/user/update-name
 * Update user name
 * Rate limited: Uses bookOperationsLimiter (100 requests/15 minutes)
 */
router.post(
  '/update-name',
  checkJwt,
  bookOperationsLimiter, // Apply rate limiting
  validateBody(updateUserNameSchema),
  userController.updateUserName
);

/**
 * POST /api/user/sync
 * Sync user profile from Auth0
 */
router.post('/sync', checkJwt, userController.syncUserProfile);

/**
 * POST /api/user/delete
 * Delete user account permanently
 * Deletes all user data, files from B2, and Auth0 account
 * Rate limited: Uses bookOperationsLimiter
 */
router.post(
  '/delete',
  checkJwt,
  bookOperationsLimiter,
  validateBody(deleteAccountSchema),
  userController.deleteUserAccount
);

/**
 * GET /api/user/welcome-status
 * Get welcome screen status
 * Rate limited: 20 requests per 15 minutes
 */
router.get('/welcome-status', checkJwt, welcomeScreenLimiter, userController.getWelcomeStatus);

/**
 * POST /api/user/welcome-shown
 * Mark welcome screen as shown
 * Rate limited: 20 requests per 15 minutes
 */
router.post('/welcome-shown', checkJwt, welcomeScreenLimiter, userController.markWelcomeShown);

module.exports = router;
