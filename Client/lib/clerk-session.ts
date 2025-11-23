import { auth, currentUser } from '@clerk/nextjs/server';
import { logger } from './logger';

/**
 * Get the current user session from Clerk
 * Can be used in Server Components, Server Actions, and Route Handlers
 */
export async function getSession() {
  try {
    const { userId, sessionId, getToken } = await auth();
    
    if (!userId || !sessionId) {
      return null;
    }

    // Get access token for backend API calls
    const accessToken = await getToken();

    return {
      user: {
        sub: userId,
      },
      sessionId,
      tokenSet: {
        accessToken: accessToken || '',
      },
      accessToken: accessToken || '',
    };
  } catch (error) {
    logger.error('Error getting Clerk session:', error);
    return null;
  }
}

/**
 * Get the current user from Clerk
 * Returns null if user is not authenticated
 */
export async function getUser() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return null;
    }

    return {
      sub: user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : user.firstName || user.lastName || user.username || 'User',
      email: user.emailAddresses[0]?.emailAddress,
      picture: user.imageUrl,
      nickname: user.username,
    };
  } catch (error) {
    logger.error('Error getting Clerk user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { userId } = await auth();
    return !!userId;
  } catch (error) {
    logger.error('Error checking authentication:', error);
    return false;
  }
}
