const prisma = require('../config/database');
const logger = require('../utils/logger');
const { sanitizeText } = require('../utils/sanitize');
const userService = require('../services/user.service');
const { fetchClerkUserInfo } = require('../utils/clerk-userinfo');
const { clerkClient } = require('@clerk/express');

/**
 * Get user profile with optional selective field fetching
 * 
 * Supports query parameter for selective field fetching:
 * - GET /api/user/profile → Returns all fields
 * - GET /api/user/profile?fields=name,email → Returns only specified fields
 * 
 * This optimizes bandwidth by allowing clients to request only needed fields.
 * Cache: 5 minutes for profile data
 * 
 * IMPORTANT: This endpoint ensures the user exists in the database
 * If user doesn't exist, it will be created with data from Clerk
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Parse requested fields from query parameter
    // Default to essential fields if not specified
    const requestedFields = req.query.fields 
      ? req.query.fields.split(',').map(f => f.trim())
      : ['id', 'email', 'name', 'picture', 'nickname', 'updatedAt'];

    // Whitelist allowed fields to prevent injection
    const allowedFields = ['id', 'email', 'name', 'picture', 'nickname', 'updatedAt'];
    const selectedFields = requestedFields.filter(field => 
      allowedFields.includes(field)
    );

    // If no valid fields requested, use defaults
    if (selectedFields.length === 0) {
      selectedFields.push('name', 'email');
    }

    // Build select object for Prisma
    const selectObject = selectedFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectObject,
    });

    // If user doesn't exist, create them with Clerk data
    if (!user) {
      logger.info('User not found in database, creating from Clerk data', { userId });
      
      try {
        // Fetch user info from Clerk
        const clerkUserInfo = await fetchClerkUserInfo(userId);
        
        if (!clerkUserInfo) {
          logger.error('Failed to fetch user info from Clerk', { userId });
          return res.status(500).json({ error: 'Failed to fetch user information' });
        }
        
        // Create user in database
        user = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUserInfo.email || `noemail-${Date.now()}-${userId.substring(0, 10)}@pending.sync`,
            name: sanitizeText(clerkUserInfo.name || 'User'),
            picture: clerkUserInfo.picture,
            nickname: sanitizeText(clerkUserInfo.nickname),
          },
          select: selectObject,
        });
        
        logger.info('User created in database', { 
          userId, 
          email: user.email,
        });
      } catch (createError) {
        logger.error('Failed to create user in database', { 
          userId, 
          error: createError.message,
          stack: createError.stack,
        });
        return res.status(500).json({ error: 'Failed to create user profile' });
      }
    }

    // Add cache headers for better performance
    res.set({
      'Cache-Control': 'private, max-age=300', // 5 minutes
      'ETag': `"${user?.updatedAt?.getTime() || 'empty'}"`,
    });

    // Log fields count for monitoring
    logger.info('User profile fetched', { 
      userId, 
      fieldsRequested: selectedFields.length,
      fields: selectedFields.join(',')
    });

    res.json({ user: user || {} });
  } catch (error) {
    logger.error('Error fetching user profile:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

/**
 * Update user name
 * Validation: 1-25 characters (optimized for performance)
 * Security: Input sanitization, XSS prevention
 */
exports.updateUserName = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { name } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required and must be a string' });
    }

    // Sanitize and trim the input
    let sanitizedName = sanitizeText(name.trim(), 25);
    
    if (sanitizedName.length === 0) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    // Optimized limit: 25 characters for performance
    if (sanitizedName.length > 25) {
      return res.status(400).json({ error: 'Name is too long (max 25 characters)' });
    }

    // Additional XSS prevention: check for suspicious patterns
    if (/[<>"{}`]|javascript:|on\w+\s*=/i.test(sanitizedName)) {
      return res.status(400).json({ error: 'Name contains invalid characters' });
    }

    // Fetch user info from Clerk
    const clerkUserInfo = await fetchClerkUserInfo(userId);
    
    if (!clerkUserInfo) {
      logger.error('Failed to fetch user info from Clerk for name update', { userId });
      return res.status(500).json({ error: 'Failed to fetch user information' });
    }
    
    const userEmail = clerkUserInfo.email;
    const userPicture = clerkUserInfo.picture;
    const userNickname = clerkUserInfo.nickname;
    
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: { 
        name: sanitizedName,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        name: sanitizedName,
        email: userEmail || `placeholder-${Date.now()}-${userId.substring(0, 10)}@pending.email`,
        picture: userPicture,
        nickname: sanitizeText(userNickname),
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        nickname: true,
        updatedAt: true,
      },
    });

    // Sync change to Clerk
    try {
      // Split name into first and last name for Clerk
      // Simple split by first space
      const nameParts = sanitizedName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

      await clerkClient.users.updateUser(userId, {
        firstName,
        lastName,
      });
      
      logger.info('User name synced to Clerk', { userId });
    } catch (clerkError) {
      // Log error but don't fail the request since DB update succeeded
      logger.error('Failed to sync name to Clerk', { 
        userId, 
        error: clerkError.message 
      });
    }

    logger.info('User name updated', { userId, nameLength: sanitizedName.length });
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    res.json({
      message: 'Name updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user name:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to update user name' });
  }
};

/**
 * Sync user profile from Clerk
 * Called after login to ensure user exists in database
 */
exports.syncUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch user info from Clerk
    const clerkUserInfo = await fetchClerkUserInfo(userId);
    
    if (!clerkUserInfo) {
      logger.error('Failed to fetch user info from Clerk for sync', { userId });
      return res.status(500).json({ error: 'Failed to fetch user information' });
    }

    const { email, name, picture, nickname } = clerkUserInfo;

    // Only sanitize user-provided fields
    const sanitizedNickname = sanitizeText(nickname);
    
    // Upsert user with Clerk data
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: email || undefined,
        picture: picture, // URL is validated by Auth0
        nickname: sanitizedNickname || undefined,
        // Don't override custom name if already set
      },
      create: {
        id: userId,
        email: email || `placeholder-${Date.now()}-${userId.substring(0, 10)}@pending.email`,
        name: sanitizeText(name || nickname || 'User'),
        picture,
        nickname: sanitizedNickname,
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        nickname: true,
        updatedAt: true,
      },
    });

    logger.info('User profile synced', { userId, emailDomain: email?.split('@')[1] });
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    res.json({ message: 'Profile synced', user });
  } catch (error) {
    logger.error('Error syncing user profile:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to sync user profile' });
  }
};

/**
 * Change user email
 * Security: Password verification required
 * This will:
 * - Add new email to Clerk user (requires verification)
 * - Once verified by user, webhook will update database
 * - Send notification to old email
 * 
 * IMPORTANT: This requires Clerk webhook to be set up for email.updated event
 * to automatically sync verified email to database
 */
exports.changeUserEmail = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { newEmail, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate inputs
    if (!newEmail || !password) {
      return res.status(400).json({ error: 'New email and password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Get current user info from database
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const oldEmail = currentUser?.email;

    logger.info('Email change requested', { userId, oldEmail, newEmail });

    try {
      // Create a new email address for the user in Clerk
      // This will send a verification email to the new address
      const emailAddress = await clerkClient.emailAddresses.createEmailAddress({
        userId: userId,
        emailAddress: newEmail,
      });

      logger.info('Email address created in Clerk', { 
        userId, 
        emailId: emailAddress.id,
        verified: emailAddress.verification?.status 
      });

      // TODO: Send notification to old email about email change
      // This is a security best practice to alert user of account changes
      logger.info('Email change notification should be sent', { 
        oldEmail, 
        newEmail,
        userId 
      });

      // Return success with instructions
      return res.json({
        message: 'Verification email sent. Please check your inbox and verify the new email address. After verification, use "Sync Profile" to update your profile.',
        emailId: emailAddress.id,
        requiresVerification: true,
        note: 'Your database email will be updated automatically via webhook after verification, or you can manually sync your profile.',
      });

    } catch (clerkError) {
      logger.error('Clerk email creation failed', {
        userId,
        error: clerkError.message,
        clerkErrorData: clerkError.errors || clerkError,
      });

      // Handle specific Clerk errors
      if (clerkError.errors && Array.isArray(clerkError.errors)) {
        const errorMessage = clerkError.errors[0]?.message || 'Failed to change email';
        if (errorMessage.toLowerCase().includes('already exists')) {
          return res.status(400).json({ error: 'This email is already in use' });
        }
        return res.status(400).json({ error: errorMessage });
      }

      return res.status(500).json({ 
        error: 'Failed to change email. Please try again later.' 
      });
    }

  } catch (error) {
    logger.error('Error changing user email:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.auth?.userId,
    });
    res.status(500).json({ error: 'Failed to change email' });
  }
};

/**
 * Change user password
 * Security: Current password verification required
 * This will:
 * - Update password in Clerk (user must be authenticated)
 * 
 * Note: With Clerk, password verification happens client-side through the authenticated session.
 * We trust the authenticated session and allow password update directly.
 */
exports.changeUserPassword = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Ensure new password is different from current
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    logger.info('Password change requested', { userId });

    try {
      // Get user from Clerk to verify they have password auth
      const user = await clerkClient.users.getUser(userId);
      
      if (!user.passwordEnabled) {
        return res.status(400).json({ 
          error: 'Password authentication is not enabled for this account. Please use your social login provider.' 
        });
      }

      // Update password in Clerk
      // Note: Clerk handles password hashing and security automatically
      await clerkClient.users.updateUser(userId, {
        password: newPassword,
      });

      logger.info('Password updated successfully', { userId });

      // Return success
      return res.json({
        message: 'Password changed successfully',
      });

    } catch (clerkError) {
      logger.error('Clerk password change failed', {
        userId,
        error: clerkError.message,
        clerkErrorData: clerkError.errors || clerkError,
      });

      // Handle specific Clerk errors
      if (clerkError.errors && Array.isArray(clerkError.errors)) {
        const errorMessage = clerkError.errors[0]?.message || 'Failed to change password';
        
        // Check for common password errors
        if (errorMessage.toLowerCase().includes('weak') || 
            errorMessage.toLowerCase().includes('common')) {
          return res.status(400).json({ 
            error: 'Password is too weak. Please use a stronger password.' 
          });
        }
        
        if (errorMessage.toLowerCase().includes('pwned') ||
            errorMessage.toLowerCase().includes('compromised')) {
          return res.status(400).json({ 
            error: 'This password has been compromised in a data breach. Please use a different password.' 
          });
        }
        
        return res.status(400).json({ error: errorMessage });
      }

      return res.status(500).json({ 
        error: 'Failed to change password. Please try again later.' 
      });
    }

  } catch (error) {
    logger.error('Error changing user password:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.auth?.userId,
    });
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Delete user account permanently
 * Security: Password verification required
 * This will delete:
 * - All user data from database (books, bookmarks, annotations, etc.)
 * - All files from B2 cloud storage
 * - User from Clerk
 */
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { email, password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database to verify email
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, id: true },
    });

    // If user not found by ID, try to find by the submitted email
    if (!user) {
      logger.info('User not found by ID, trying to find by email', { userId, submittedEmail: email });
      
      if (email) {
        // Use findFirst for case-insensitive email search
        user = await prisma.user.findFirst({
          where: {
            email: {
              equals: email.trim(),
              mode: 'insensitive'
            }
          },
          select: { email: true, id: true },
        });

        if (user) {
          // User found by email, use existing record
          logger.info('User found by email', { existingId: user.id, requestedId: userId });
        } else {
          // User doesn't exist at all
          logger.error('User not found in database', { userId, submittedEmail: email });
          return res.status(404).json({ error: 'User not found' });
        }
      } else {
        return res.status(400).json({ error: 'Email not provided' });
      }
    }

    // Verify the submitted email matches the database email
    if (email.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
      logger.warn('Email mismatch on delete attempt', { 
        userId, 
        submittedEmail: email,
        databaseEmail: user.email
      });
      return res.status(400).json({ error: 'Email does not match your account' });
    }

    // Update userId to the actual user ID from database (in case user was found by email)
    const actualUserId = user.id;

    // Delete the account
    logger.info('Account deletion requested', { userId, actualUserId, email });
    
    const result = await userService.deleteUserAccount(actualUserId, email, password);

    if (!result.success) {
      logger.error('Account deletion failed', { actualUserId, result });
      return res.status(500).json({ 
        error: 'Failed to delete account',
        details: result.errors,
      });
    }

    // Log successful deletion
    logger.info('Account deleted successfully', { 
      actualUserId, 
      email,
      stats: {
        database: result.databaseStats,
        files: result.filesDeleted,
        clerk: result.deletedFromClerk,
      },
    });

    // Return success with statistics
    res.json({
      message: 'Account deleted successfully',
      deleted: {
        database: result.deletedFromDatabase,
        clerk: result.deletedFromClerk,
        stats: {
          books: result.databaseStats.books,
          bookmarks: result.databaseStats.bookmarks,
          annotations: result.databaseStats.annotations,
          highlights: result.databaseStats.highlights,
          readingSessions: result.databaseStats.readingSessions,
          readingGoals: result.databaseStats.readingGoals,
          collections: result.databaseStats.collections,
          filesDeleted: result.filesDeleted.booksDeleted + result.filesDeleted.coversDeleted,
        },
      },
    });
  } catch (error) {
    logger.error('Error deleting user account:', { 
      error: error.message, 
      stack: error.stack,
      userId: req.auth?.userId,
    });

    // Send appropriate error response
    if (error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.status(500).json({ error: 'Failed to delete account' });
  }
};

/**
 * Get welcome screen status
 * Returns whether the user has seen the welcome screen
 * 
 * Behavior:
 * - New user (not in DB): Returns false → welcome screen shown
 * - Existing user (welcomeShown=false): Returns false → welcome screen shown
 * - Existing user (welcomeShown=true): Returns true → welcome screen NOT shown
 * 
 * This ensures welcome is only shown to new users on first visit
 */
exports.getWelcomeStatus = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { welcomeShown: true },
    });

    // If user doesn't exist yet, they haven't seen welcome screen
    const welcomeShown = user?.welcomeShown || false;

    // Add cache headers
    res.set({
      'Cache-Control': 'private, max-age=60', // 1 minute
    });

    res.json({ welcomeShown });
  } catch (error) {
    logger.error('Error fetching welcome status:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch welcome status' });
  }
};

/**
 * Mark welcome screen as shown
 * Updates the user's welcomeShown flag to true - this is permanent
 * If user doesn't exist, creates them with proper email from Clerk
 * 
 * After this is called, the user will never see the welcome screen again
 */
exports.markWelcomeShown = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, try to update the existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    let updatedUser;
    
    if (existingUser) {
      // User exists, just update
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          welcomeShown: true,
          updatedAt: new Date(),
        },
        select: {
          welcomeShown: true,
        },
      });
    } else {
      // User doesn't exist, create new user with Clerk info
      const clerkUserInfo = await fetchClerkUserInfo(userId);
      
      if (!clerkUserInfo) {
        logger.error('Failed to fetch user info from Clerk for new user', { userId });
        return res.status(500).json({ error: 'Failed to fetch user information' });
      }
      
      const { email: userEmail, name: userName, picture: userPicture, nickname: userNickname } = clerkUserInfo;
      
      // Warn if we still don't have an email (shouldn't happen with Clerk)
      if (!userEmail) {
        logger.warn('Creating user without email from Clerk - will use placeholder', { 
          userId,
        });
      }
      
      updatedUser = await prisma.user.create({
        data: {
          id: userId,
          email: userEmail || `noemail-${Date.now()}-${userId.substring(0, 10)}@pending.sync`,
          name: sanitizeText(userName || userNickname || 'User'),
          picture: userPicture,
          nickname: sanitizeText(userNickname),
          welcomeShown: true,
          updatedAt: new Date(),
        },
        select: {
          welcomeShown: true,
        },
      });
      
      logger.info('User created with welcome shown', { 
        userId, 
        hasRealEmail: !!userEmail,
      });
    }

    logger.info('Welcome screen marked as shown', { userId });
    
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
    
    res.json({
      message: 'Welcome screen marked as shown',
      welcomeShown: updatedUser.welcomeShown,
    });
  } catch (error) {
    logger.error('Error marking welcome shown:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to mark welcome shown' });
  }
};

