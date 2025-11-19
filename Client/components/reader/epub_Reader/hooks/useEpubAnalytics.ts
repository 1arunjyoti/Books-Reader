import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseEpubAnalyticsProps {
  bookId: string;
  currentPage?: number;
  pageInfo: { current: number; total: number };
  getAccessToken: () => Promise<string | null>;
}

export function useEpubAnalytics({ bookId, currentPage, pageInfo, getAccessToken }: UseEpubAnalyticsProps) {
  // Session tracking states
  const [sessionStart, setSessionStart] = useState<Date>(new Date());
  const [sessionStartPage, setSessionStartPage] = useState<number>(currentPage || 1);
  const [isWindowActive, setIsWindowActive] = useState<boolean>(true);
  const isMountedRef = useRef<boolean>(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoize logReadingSession to prevent recreating on every render
  const logReadingSession = useCallback(async () => {
    if (!isMountedRef.current || !sessionStart || !isWindowActive) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - sessionStart.getTime()) / 1000); // in seconds

    // Only log if session is at least 10 seconds
    if (duration < 10) return;

    const currentPageNum = pageInfo.current || 1;
    const pagesRead = Math.abs(currentPageNum - sessionStartPage);
    const progressDelta = Math.abs(currentPageNum - sessionStartPage);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken || !isMountedRef.current) {
        return;
      }
      
      const { createReadingSession } = await import('@/lib/api');
      await createReadingSession({
        bookId,
        duration,
        pagesRead,
        startPage: sessionStartPage,
        endPage: currentPageNum,
        progressDelta
      }, accessToken);

      // Reset session only if still mounted
      if (isMountedRef.current) {
        setSessionStart(new Date());
        setSessionStartPage(currentPageNum);
      }
    } catch (error) {
      // Analytics is non-critical, silently ignore if component unmounted
      if (isMountedRef.current) {
        logger.warn('Unable to log reading session (analytics unavailable):', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [sessionStart, isWindowActive, pageInfo, sessionStartPage, bookId, getAccessToken]);
  
  // Track window visibility and focus
  useEffect(() => {
    let isMounted = true;

    // Track window visibility
    const handleVisibilityChange = () => {
      if (isMounted) {
        const isActive = !document.hidden;
        setIsWindowActive(isActive);
        
        // Log session when window becomes hidden
        if (!isActive) {
          logReadingSession();
        }
      }
    };

    // Track window focus
    const handleFocus = () => {
      if (isMounted) setIsWindowActive(true);
    };

    const handleBlur = () => {
      if (isMounted) {
        setIsWindowActive(false);
        logReadingSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [logReadingSession]);

  // Log session on unmount or when closing
  useEffect(() => {
    return () => {
      // Call logReadingSession but don't await it
      // If component unmounts before completion, errors will be silently ignored
      logReadingSession().catch(() => {
        // Silently ignore errors on unmount
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on unmount

  // Periodic session logging (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      logReadingSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [logReadingSession]);

  return {
    sessionStart,
    sessionStartPage,
    isWindowActive,
    logReadingSession,
  };
}
