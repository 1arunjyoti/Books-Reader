// hooks/useReadingMode.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { safeLocalStorageGetItem, safeLocalStorageSetItem } from '@/lib/safe-local-storage';
import { logger } from '@/lib/logger';

const HIDE_TIMEOUT_MS = 3000; // 3 seconds of inactivity
const TOP_PORTION_HEIGHT = 80; // Show toolbar when mouse is in top 80px

interface UseReadingModeOptions {
  bookId: string;
  enabled?: boolean; // Disable reading mode on mobile
}

export function useReadingMode({ bookId, enabled = true }: UseReadingModeOptions) {
  const [readingMode, setReadingMode] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize reading mode preference from localStorage
  useEffect(() => {
    if (!enabled) return;

    try {
      const saved = safeLocalStorageGetItem(`reading-mode-${bookId}`);
      if (saved === 'true') {
        setReadingMode(true);
      }
    } catch (e) {
      logger.error('Failed to load reading mode preference', e);
    }
  }, [bookId, enabled]);

  // Save reading mode preference to localStorage
  useEffect(() => {
    if (!enabled) return;

    try {
      safeLocalStorageSetItem(`reading-mode-${bookId}`, String(readingMode));
    } catch (e) {
      logger.error('Failed to save reading mode preference', e);
    }
  }, [readingMode, bookId, enabled]);

  // Show toolbar and reset hide timer
  const showToolbar = useCallback(() => {
    setToolbarVisible(true);

    // Clear existing timer
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    // Hide after inactivity
    if (readingMode) {
      hideTimerRef.current = setTimeout(() => {
        setToolbarVisible(false);
      }, HIDE_TIMEOUT_MS);
    }
  }, [readingMode]);

  // Set up event listeners for mouse movement in top portion
  useEffect(() => {
    if (!enabled || !readingMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Only show toolbar if mouse is in top portion of screen
      if (e.clientY <= TOP_PORTION_HEIGHT) {
        showToolbar();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Show toolbar on any key press (except when typing in inputs)
      if (
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        showToolbar();
      }
    };

    const handleScroll = () => {
      showToolbar();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll);

    // Show toolbar initially
    showToolbar();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [readingMode, enabled, showToolbar]);

  // Toggle reading mode with 'R' keyboard shortcut
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is not typing in an input or textarea
      if (
        e.key.toLowerCase() === 'r' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setReadingMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return {
    readingMode,
    setReadingMode,
    toolbarVisible,
    showToolbar,
  };
}
