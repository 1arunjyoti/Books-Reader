const { clerkClient, requireAuth } = require('@clerk/express');

/**
 * Clerk JWT validation middleware
 * Validates JWT tokens from Clerk for protected routes
 * Uses Clerk's requireAuth middleware which automatically validates the session
 */
const checkJwt = requireAuth({
  onError: (error) => {
    console.error('Clerk authentication error:', error);
    return { error: 'Unauthorized - No valid authentication' };
  }
});

/**
 * Verify and get user from Clerk token
 */
async function getUserFromToken(req) {
  try {
    if (!req.auth || !req.auth.userId) {
      return null;
    }
    
    const userId = req.auth.userId;
    const user = await clerkClient.users.getUser(userId);
    
    return {
      sub: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || user.username,
    };
  } catch (error) {
    console.error('Error getting user from Clerk token:', error);
    return null;
  }
}

module.exports = { checkJwt, getUserFromToken };
