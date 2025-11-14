import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

type ViewMode = 'grid' | 'list';

export const useViewPreferences = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load from localStorage after mount (prevent SSR mismatch)
    try {
      const saved = localStorage.getItem('libraryViewMode');
      if (saved === 'list' || saved === 'grid') {
        setViewMode(saved);
      }
    } catch (error) {
      logger.warn('localStorage not available:', error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('libraryViewMode', viewMode);
      } catch (error) {
        logger.warn('Failed to save view mode:', error);
      }
    }
  }, [viewMode, isHydrated]);

  return { viewMode, setViewMode, isHydrated };
};
