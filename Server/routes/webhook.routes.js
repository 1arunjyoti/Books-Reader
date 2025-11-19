const express = require('express');
const { handleClerkWebhook } = require('../controllers/clerk-webhook.controller');

const router = express.Router();

/**
 * POST /webhooks/clerk
 * Handle webhooks from Clerk
 * 
 * This endpoint receives events from Clerk when:
 * - User profile is updated
 * - User is deleted
 * - Email address is created, updated, or deleted
 * 
 * Important: This route should NOT use checkJwt middleware
 * because webhooks come from Clerk servers, not from authenticated users
 * 
 * Security: Webhook signature is verified in the controller
 * 
 * Note: Express JSON middleware already parses body in server.js
 * Signature verification works with parsed JSON body
 */
router.post(
  '/clerk',
  handleClerkWebhook
);

module.exports = router;
