/**
 * API call wrapper with automatic token refresh on 401 errors
 * 
 * This wrapper handles the case where a token expires between cache check and API call.
 * If a 401 error is received, it:
 * 1. Clears the token cache
 * 2. Fetches a fresh token
 * 3. Retries the API call once
 * 
 * This ensures users aren't blocked after leaving the browser open for extended periods.
 */

import { logger } from './logger';

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  accessToken: string;
}

/**
 * Make an API call with automatic token refresh on 401 errors
 * 
 * @param url - The API endpoint URL
 * @param options - Request options including the current access token
 * @returns The parsed JSON response
 * @throws Error if the request fails after retry
 */
export async function apiCallWithTokenRefresh<T>(
  url: string,
  options: ApiCallOptions
): Promise<T> {
  const { accessToken, method = 'GET', headers = {}, body } = options;

  // Helper function to make the actual API call
  const makeCall = async (token: string): Promise<Response> => {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        'Authorization': `Bearer ${token}`,
      },
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    return fetch(url, fetchOptions);
  };

  try {
    // First attempt with provided token
    const response = await makeCall(accessToken);

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    // If we get a 401, try to refresh the token and retry once
    if (response.status === 401) {
      logger.warn('Received 401 Unauthorized, attempting to refresh token...');

      try {
        // Fetch a fresh token
        const tokenResponse = await fetch('/api/auth/token');
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to refresh token');
        }

        const { accessToken: freshToken } = await tokenResponse.json();

        if (!freshToken) {
          throw new Error('No access token in refresh response');
        }

        // Retry with fresh token
        const retryResponse = await makeCall(freshToken);

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(
            `API call failed after token refresh: ${retryResponse.status} ${JSON.stringify(errorData)}`
          );
        }

        return retryResponse.json() as Promise<T>;
      } catch (refreshError) {
        // If token refresh fails, re-throw with context
        logger.error('Token refresh failed:', refreshError);
        throw new Error(
          `Session expired. Please sign in again. ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`
        );
      }
    }

    // For non-401 errors, throw with the response status and any error data
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API call failed: ${response.status} ${JSON.stringify(errorData)}`
    );
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error during API call: ${String(error)}`);
  }
}
