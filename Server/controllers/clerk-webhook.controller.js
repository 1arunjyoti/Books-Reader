const { Webhook } = require('svix');
const prisma = require('../config/database');
const logger = require('../utils/logger');

/**
 * Clerk Webhook Handler
 * Handles events from Clerk to keep database in sync
 * 
 * Required webhook events to subscribe to in Clerk Dashboard:
 * - user.updated
 * - user.deleted
 * - emailAddress.created
 * - emailAddress.updated
 * - emailAddress.deleted
 */

/**
 * Verify webhook signature from Clerk
 * This ensures the webhook is authentic and from Clerk
 */
function verifyWebhookSignature(req) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET is not configured');
  }

  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new Error('Missing svix headers');
  }

  const webhook = new Webhook(WEBHOOK_SECRET);
  
  try {
    return webhook.verify(req.rawBody, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (error) {
    throw new Error('Webhook signature verification failed');
  }
}

/**
 * Handle Clerk webhook events
 */
const handleClerkWebhook = async (req, res) => {
  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(req);
    
    const eventType = event.type;
    const eventData = event.data;

    logger.info('Clerk webhook received', { 
      eventType, 
      userId: eventData.id,
    });

    // Handle different event types
    switch (eventType) {
      case 'user.updated':
        await handleUserUpdated(eventData);
        break;

      case 'user.deleted':
        await handleUserDeleted(eventData);
        break;

      case 'emailAddress.created':
        logger.info('Email address created in Clerk', {
          userId: eventData.user_id,
          emailId: eventData.id,
          email: eventData.email_address,
        });
        // No action needed - user must verify before it becomes primary
        break;

      case 'emailAddress.updated':
        await handleEmailAddressUpdated(eventData);
        break;

      case 'emailAddress.deleted':
        logger.info('Email address deleted in Clerk', {
          userId: eventData.user_id,
          emailId: eventData.id,
        });
        // No action needed - database keeps last known email
        break;

      default:
        logger.warn('Unhandled webhook event type', { eventType });
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });

  } catch (error) {
    logger.error('Webhook processing error:', {
      error: error.message,
      stack: error.stack,
    });
    
    // Return error but don't expose details
    res.status(400).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle user.updated event
 * Syncs user profile changes from Clerk to database
 */
async function handleUserUpdated(userData) {
  const userId = userData.id;
  
  try {
    // Get primary email
    const primaryEmailId = userData.primary_email_address_id;
    const primaryEmail = userData.email_addresses?.find(e => e.id === primaryEmailId);
    
    // Update user in database
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: primaryEmail?.email_address || undefined,
        // Don't update name - user may have customized it
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: primaryEmail?.email_address || `noemail-${Date.now()}-${userId.substring(0, 10)}@pending.sync`,
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
        picture: userData.image_url,
      },
    });

    logger.info('User profile synced from webhook', {
      userId,
      email: primaryEmail?.email_address,
    });

  } catch (error) {
    logger.error('Failed to handle user.updated webhook', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Handle user.deleted event
 * This is called when user is deleted from Clerk
 * Clean up database if user still exists
 */
async function handleUserDeleted(userData) {
  const userId = userData.id;
  
  try {
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      logger.info('User already deleted from database', { userId });
      return;
    }

    // Delete user from database
    // Note: Cascade delete should handle related records
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted from database via webhook', { userId });

  } catch (error) {
    logger.error('Failed to handle user.deleted webhook', {
      userId,
      error: error.message,
      stack: error.stack,
    });
    // Don't throw - user is already deleted from Clerk
  }
}

/**
 * Handle emailAddress.updated event
 * This is triggered when email is verified or set as primary
 * Update database with new verified email
 */
async function handleEmailAddressUpdated(emailData) {
  const userId = emailData.user_id;
  const emailAddress = emailData.email_address;
  const verified = emailData.verification?.status === 'verified';
  
  try {
    // Only update if email is verified
    if (!verified) {
      logger.info('Email not yet verified, skipping database update', {
        userId,
        email: emailAddress,
      });
      return;
    }

    // Check if this is the primary email
    // We need to fetch user from Clerk to verify
    // For now, update if verified (webhook fires when set as primary)
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const oldEmail = user?.email;

    // Update email in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: emailAddress,
        updatedAt: new Date(),
      },
    });

    logger.info('Email updated in database from webhook', {
      userId,
      oldEmail,
      newEmail: emailAddress,
    });

    // TODO: Send notification to old email about successful email change
    logger.info('Email change completed notification should be sent', {
      userId,
      oldEmail,
      newEmail: emailAddress,
    });

  } catch (error) {
    logger.error('Failed to handle emailAddress.updated webhook', {
      userId,
      email: emailAddress,
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

module.exports = {
  handleClerkWebhook,
};
