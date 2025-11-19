const express = require('express');
const { checkJwt } = require('../middleware/clerk-auth');
const { validateBody } = require('../middleware/validator');
const { bookOperationsLimiter, welcomeScreenLimiter, sensitiveOperationsLimiter } = require('../middleware/rateLimiter');
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

const changeEmailSchema = z.object({
  newEmail: z.string()
    .email('Invalid email address')
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long'),
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
 * POST /api/user/change-email
 * Change user email
 * Rate limited: Uses sensitiveOperationsLimiter (5 requests/15 minutes)
 */
router.post(
  '/change-email',
  checkJwt,
  sensitiveOperationsLimiter, // More restrictive for security
  validateBody(changeEmailSchema),
  userController.changeUserEmail
);

/**
 * POST /api/user/change-password
 * Change user password
 * Rate limited: Uses sensitiveOperationsLimiter (5 requests/15 minutes)
 */
router.post(
  '/change-password',
  checkJwt,
  sensitiveOperationsLimiter, // More restrictive for security
  validateBody(changePasswordSchema),
  userController.changeUserPassword
);

/**
 * POST /api/user/sync
 * Sync user profile from Auth0
 */
router.post('/sync', checkJwt, userController.syncUserProfile);

/**
 * POST /api/user/delete
 * Delete user account permanently
 * Deletes all user data, files from B2, and Clerk account
 * Rate limited: Uses sensitiveOperationsLimiter (5 requests/15 minutes)
 */
router.post(
  '/delete',
  checkJwt,
  sensitiveOperationsLimiter, // More restrictive for security
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
