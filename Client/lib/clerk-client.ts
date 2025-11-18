/**
 * Get Clerk access token for API calls
 * This is a client-side utility that fetches the token from Clerk
 */
import { logger } from './logger';

export async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/token');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Token endpoint error:', { status: response.status, errorData });
      throw new Error(`Failed to get access token: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    logger.error('Error getting access token:', error);
    return null;
  }
}
