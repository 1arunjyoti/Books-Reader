'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { createReadingSession } from '@/lib/api';

/**
 * Session State Interface
 * Tracks reading session information for analytics
 */
export interface SessionState {
  sessionStart: Date | null;
  sessionStartSection: number;
  isWindowActive: boolean;
}

export type SessionAction =
  | { type: 'START_SESSION'; payload: { section: number } }
  | { type: 'SET_WINDOW_ACTIVE'; payload: boolean }
  | { type: 'RESET_SESSION'; payload: { section: number } };

/**
 * Session Reducer
 * Manages session state with proper immutability
 */
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        sessionStart: new Date(),
        sessionStartSection: action.payload.section,
        isWindowActive: true,
      };

    case 'SET_WINDOW_ACTIVE':
      return {
        ...state,
        isWindowActive: action.payload,
      };

    case 'RESET_SESSION':
      return {
        sessionStart: new Date(),
        sessionStartSection: action.payload.section,
        isWindowActive: state.isWindowActive,
      };

    default:
      return state;
  }
}

/**
 * Hook: useTxtSessionTracking
 * Manages reading session tracking for TXT reader
 * 
 * Features:
 * - Tracks session start time and initial section
 * - Logs sessions when user leaves (blur/hidden)
 * - Periodically logs active sessions (every 5 minutes)
 * - Handles window focus/visibility changes
 * - Resets session after logging
 * 
 * @param bookId - Book ID for session tracking
 * @param currentSection - Current section being read
 * @returns Session tracking utilities and state
 */
export function useTxtSessionTracking(bookId: string, currentSection: number) {
  // Get auth token
  const { getAccessToken } = useAuthToken();

  // Initialize session state
  const [sessionState, dispatchSession] = useReducer(sessionReducer, {
    sessionStart: null,
    sessionStartSection: currentSection,
    isWindowActive: true,
  });

  const { sessionStart, sessionStartSection, isWindowActive } = sessionState;

  // Keep track of whether component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  /**
   * Log the current reading session
   * Only logs if session duration is at least 10 seconds
   */
  const logReadingSession = useCallback(async () => {
    if (!sessionStart || !isWindowActive) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - sessionStart.getTime()) / 1000); // in seconds

    // Only log if session is at least 10 seconds
    if (duration < 10) return;

    // Calculate sections read
    const sectionsRead = Math.abs(currentSection - sessionStartSection);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for reading session');
        return;
      }

      // Log the session
      await createReadingSession(
        {
          bookId,
          duration,
          pagesRead: sectionsRead, // For TXT, sections = pages
          startPage: sessionStartSection,
          endPage: currentSection,
          progressDelta: sectionsRead,
        },
        accessToken
      );

      // Reset session only if component is still mounted
      if (isMountedRef.current) {
        dispatchSession({ type: 'START_SESSION', payload: { section: currentSection } });
      }
    } catch (error) {
      logger.warn('Unable to log reading session (analytics unavailable):', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [sessionStart, isWindowActive, currentSection, sessionStartSection, bookId, getAccessToken]);

  /**
   * Initialize session on mount
   */
  useEffect(() => {
    dispatchSession({ type: 'START_SESSION', payload: { section: currentSection } });

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /**
   * Handle window visibility and focus changes
   * Log session when user leaves and start new session when they return
   */
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Handle visibility change (switching tabs/minimizing window)
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      if (document.hidden) {
        dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: false });
        // Log session when page becomes hidden
        void logReadingSession();
      } else {
        dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: true });
        // Start new session when user returns
        dispatchSession({ type: 'START_SESSION', payload: { section: currentSection } });
      }
    };

    // Handle window blur (switching focus to another window)
    const handleBlur = () => {
      if (!isMountedRef.current) return;
      dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: false });
      void logReadingSession();
    };

    // Handle window focus (returning to window)
    const handleFocus = () => {
      if (!isMountedRef.current) return;
      dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: true });
      dispatchSession({ type: 'START_SESSION', payload: { section: currentSection } });
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      // Log final session asynchronously
      if (isMountedRef.current) {
        void logReadingSession();
      }

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [logReadingSession, currentSection]);

  /**
   * Periodically log active sessions (every 5 minutes)
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMountedRef.current && isWindowActive) {
        void logReadingSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isWindowActive, logReadingSession]);

  return {
    sessionState,
    logReadingSession,
  };
}
