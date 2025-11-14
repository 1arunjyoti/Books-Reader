const prisma = require('../config/database');
const logger = require('../utils/logger');
const { sanitizeText } = require('../utils/sanitize');
const userService = require('../services/user.service');
const { fetchAuth0UserInfo } = require('../utils/auth0-userinfo');

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
 * If user doesn't exist, it will be created with data from Auth0
 */
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;

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

    // If user doesn't exist, create them with Auth0 data
    if (!user) {
      logger.info('User not found in database, creating from Auth0 data', { userId });
      
      try {
        // Get email from JWT payload first
        let userEmail = req.auth?.payload?.email;
        let userName = req.auth?.payload?.name;
        let userPicture = req.auth?.payload?.picture;
        let userNickname = req.auth?.payload?.nickname;
        
        // If email is not in JWT, fetch from Auth0 userinfo endpoint
        if (!userEmail) {
          logger.warn('Email not in JWT payload, fetching from Auth0 userinfo', { userId });
          
          // Extract access token from Authorization header
          const authHeader = req.headers.authorization;
          if (authHeader && authHeader.startsWith('Bearer ')) {
            const accessToken = authHeader.substring(7);
            
            try {
              const auth0UserInfo = await fetchAuth0UserInfo(accessToken);
              userEmail = auth0UserInfo.email;
              userName = userName || auth0UserInfo.name;
              userPicture = userPicture || auth0UserInfo.picture;
              userNickname = userNickname || auth0UserInfo.nickname;
              
              logger.info('Retrieved user info from Auth0', { 
                userId, 
                hasEmail: !!userEmail,
              });
            } catch (auth0Error) {
              logger.error('Failed to fetch from Auth0 userinfo', { 
                userId, 
                error: auth0Error.message 
              });
              // Continue with placeholder if Auth0 fetch fails
            }
          }
        }
        
        // Create user in database
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail || `noemail-${Date.now()}-${userId.substring(0, 10)}@pending.sync`,
            name: sanitizeText(userName || userNickname || 'User'),
            picture: userPicture,
            nickname: sanitizeText(userNickname),
          },
          select: selectObject,
        });
        
        logger.info('User created in database', { 
          userId, 
          email: user.email,
          hasRealEmail: !!userEmail,
        });
      } catch (createError) {
        logger.error('Failed to create user in database', { 
          userId, 
          error: createError.message,
          stack: createError.stack,
        });
        // Return error since we couldn't create the user
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
    const userId = req.auth?.payload?.sub;
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

    // Upsert user - create if not exists, update if exists
    let userEmail = req.auth?.payload?.email;
    let userPicture = req.auth?.payload?.picture;
    let userNickname = req.auth?.payload?.nickname;
    
    // If user doesn't exist and we don't have an email, fetch from Auth0
    if (!userEmail) {
      logger.warn('User creation attempted without email from Auth0, fetching from userinfo', { userId });
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        
        try {
          const auth0UserInfo = await fetchAuth0UserInfo(accessToken);
          userEmail = auth0UserInfo.email;
          userPicture = userPicture || auth0UserInfo.picture;
          userNickname = userNickname || auth0UserInfo.nickname;
          
          logger.info('Retrieved user info from Auth0 for name update', { 
            userId, 
            hasEmail: !!userEmail,
          });
        } catch (auth0Error) {
          logger.error('Failed to fetch from Auth0 userinfo', { 
            userId, 
            error: auth0Error.message 
          });
        }
      }
    }
    
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
 * Sync user profile from Auth0
 * Called after login to ensure user exists in database
 * Security: Only updates non-custom fields on update
 */
exports.syncUserProfile = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    let { email, name, picture, nickname } = req.auth?.payload || {};

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Email should NOT be sanitized as it comes from Auth0 and has strict validation
    // Only sanitize user-provided fields
    const sanitizedNickname = sanitizeText(nickname);
    
    // If no email is available, fetch from Auth0 userinfo endpoint
    if (!email) {
      logger.warn('User sync attempted without email from Auth0, fetching from userinfo', { userId });
      
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const accessToken = authHeader.substring(7);
        
        try {
          const auth0UserInfo = await fetchAuth0UserInfo(accessToken);
          email = auth0UserInfo.email;
          name = name || auth0UserInfo.name;
          picture = picture || auth0UserInfo.picture;
          nickname = nickname || auth0UserInfo.nickname;
          
          logger.info('Retrieved user info from Auth0 for sync', { 
            userId, 
            hasEmail: !!email,
          });
        } catch (auth0Error) {
          logger.error('Failed to fetch from Auth0 userinfo during sync', { 
            userId, 
            error: auth0Error.message 
          });
        }
      }
    }

    // Upsert user with Auth0 data
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
 * Delete user account permanently
 * Security: Password verification required
 * This will delete:
 * - All user data from database (books, bookmarks, annotations, etc.)
 * - All files from B2 cloud storage
 * - User from Auth0
 */
exports.deleteUserAccount = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
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
        auth0: result.deletedFromAuth0,
      },
    });

    // Return success with statistics
    res.json({
      message: 'Account deleted successfully',
      deleted: {
        database: result.deletedFromDatabase,
        auth0: result.deletedFromAuth0,
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
      userId: req.auth?.payload?.sub,
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
 */
exports.getWelcomeStatus = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;

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
 * Updates the user's welcomeShown flag to true
 * If user doesn't exist, creates them with proper email from Auth0
 */
exports.markWelcomeShown = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;

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
      // User doesn't exist, create new user with proper email
      let userEmail = req.auth?.payload?.email;
      let userName = req.auth?.payload?.name;
      let userPicture = req.auth?.payload?.picture;
      let userNickname = req.auth?.payload?.nickname;
      
      // If email is not in JWT, fetch from Auth0 userinfo endpoint
      if (!userEmail) {
        logger.warn('Email not in JWT payload, fetching from Auth0 userinfo', { userId });
        
        // Extract access token from Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const accessToken = authHeader.substring(7);
          
          try {
            const auth0UserInfo = await fetchAuth0UserInfo(accessToken);
            userEmail = auth0UserInfo.email;
            userName = userName || auth0UserInfo.name;
            userPicture = userPicture || auth0UserInfo.picture;
            userNickname = userNickname || auth0UserInfo.nickname;
            
            logger.info('Retrieved user info from Auth0 for new user', { 
              userId, 
              hasEmail: !!userEmail,
            });
          } catch (auth0Error) {
            logger.error('Failed to fetch from Auth0 userinfo during user creation', { 
              userId, 
              error: auth0Error.message 
            });
            // Continue with placeholder if Auth0 fetch fails
          }
        }
      }
      
      // Warn if we still don't have an email (shouldn't happen with userinfo fetch)
      if (!userEmail) {
        logger.warn('Creating user without email from Auth0 - will use placeholder', { 
          userId,
          authPayload: Object.keys(req.auth?.payload || {})
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

