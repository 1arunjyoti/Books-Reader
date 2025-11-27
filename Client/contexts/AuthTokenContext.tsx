'use client';

import React, { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface TokenCache {
  token: string | null;
  expiresAt: number;
}

interface AuthTokenContextValue {
  getAccessToken: () => Promise<string | null>;
  clearToken: () => void;
  isLoading: boolean;
  error: Error | null;
}

const AuthTokenContext = createContext<AuthTokenContextValue | null>(null);

/**
 * Centralized authentication token provider
 * Manages token caching and prevents redundant API calls
 */
export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const cacheRef = useRef<TokenCache>({
    token: null,
    expiresAt: 0,
  });
  
  const fetchingRef = useRef<Promise<string | null> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Handle 401 Unauthorized errors (e.g., after account deletion)
  useEffect(() => {
    if (isUnauthorized) {
      logger.info('User is unauthorized, redirecting to sign-in');
      router.push('/sign-in');
    }
  }, [isUnauthorized, router]);

  /**
   * Helper to decode JWT and get expiration
   * Avoids adding external dependencies like jwt-decode
   */
  const getTokenExpiration = (token: string): number | null => {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      
      // Add padding if needed and replace URL-safe chars
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const { exp } = JSON.parse(jsonPayload);
      return exp ? exp * 1000 : null;
    } catch (e) {
      logger.error('Failed to decode token expiration:', e);
      return null;
    }
  };

  /**
   * Get access token with automatic caching and deduplication
   * If multiple components request token simultaneously, only one fetch occurs
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const now = Date.now();

    // Return cached token if still valid
    if (cacheRef.current.token && now < cacheRef.current.expiresAt) {
      return cacheRef.current.token;
    }

    // If already fetching, wait for that request to complete
    if (fetchingRef.current) {
      return fetchingRef.current;
    }

    // Start new fetch
    const fetchPromise = (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/auth/token');
        
        if (!response.ok) {
          // Handle 401 Unauthorized - user is not authenticated
          if (response.status === 401) {
            logger.warn('Received 401 from token endpoint, marking as unauthorized');
            setIsUnauthorized(true);
            // Clear cache on unauthorized
            cacheRef.current = {
              token: null,
              expiresAt: 0,
            };
            return null;
          }
          
          throw new Error(`Token fetch failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        const { accessToken } = data;
        
        // Calculate expiration from token itself
        const expiresAt = getTokenExpiration(accessToken);
        
        // Default to 55 seconds if decoding fails (Clerk tokens are usually 60s)
        // Using a 10s safety margin
        const safetyMargin = 10000; // 10 seconds
        const finalExpiresAt = expiresAt ? (expiresAt - safetyMargin) : (now + 50000);

        cacheRef.current = {
          token: accessToken,
          expiresAt: finalExpiresAt,
        };

        return accessToken;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch access token');
        logger.error('Error fetching access token:', error);
        setError(error);
        
        // Clear cache on error
        cacheRef.current = {
          token: null,
          expiresAt: 0,
        };
        
        return null;
      } finally {
        setIsLoading(false);
        fetchingRef.current = null;
      }
    })();

    fetchingRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  /**
   * Manually clear the token cache
   * Useful for logout or when token is known to be invalid
   */
  const clearToken = useCallback(() => {
    cacheRef.current = {
      token: null,
      expiresAt: 0,
    };
    fetchingRef.current = null;
    setError(null);
  }, []);

  const value: AuthTokenContextValue = {
    getAccessToken,
    clearToken,
    isLoading,
    error,
  };

  return (
    <AuthTokenContext.Provider value={value}>
      {children}
    </AuthTokenContext.Provider>
  );
}

/**
 * Hook to access the authentication token
 * Must be used within AuthTokenProvider
 * 
 * @example
 * const { getAccessToken, isLoading, error } = useAuthToken();
 * const token = await getAccessToken();
 */
export function useAuthToken(): AuthTokenContextValue {
  const context = useContext(AuthTokenContext);
  
  if (!context) {
    throw new Error('useAuthToken must be used within AuthTokenProvider');
  }
  
  return context;
}

/**
 * Legacy hook for backward compatibility
 * Returns just the getAccessToken function
 * 
 * @deprecated Use useAuthToken() instead for better error handling
 */
export function useTokenCache() {
  const { getAccessToken } = useAuthToken();
  return getAccessToken;
}
