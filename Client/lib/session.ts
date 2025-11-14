import { auth0 } from './auth0';
import type { SessionData } from '@auth0/nextjs-auth0/types';
import { logger } from './logger';

/**
 * Get the current user session
 * Can be used in Server Components, Server Actions, and Route Handlers
 */
export async function getSession(): Promise<SessionData | null> {
  try {
    const session = await auth0.getSession();
    return session;
  } catch (error) {
    logger.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user from session
 * Returns null if user is not authenticated
 */
export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
