import { useState, useCallback, useRef, useEffect } from 'react';
import type { Rendition, NavItem } from 'epubjs';
import { logger } from '@/lib/logger';

interface PageInfo {
  current: number;
  total: number;
}

interface UseEpubNavigationProps {
  renditionRef: React.MutableRefObject<Rendition | undefined>;
  onPageChange?: (page: number, totalPages: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLocationsGenerated?: (book: any) => void;
  initialPage?: number;
}

export function useEpubNavigation({ renditionRef, onPageChange, onLocationsGenerated, initialPage = 1 }: UseEpubNavigationProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const [pageInfo, setPageInfo] = useState<PageInfo>({ current: 0, total: 0 });
  const [pageInput, setPageInput] = useState('1');
  const [isGeneratingLocations, setIsGeneratingLocations] = useState(false);
  const [locationGenerationProgress, setLocationGenerationProgress] = useState(0);
  const [locationsReady, setLocationsReady] = useState(false);
  
  // Track if we've navigated to initial page
  const hasNavigatedToInitialPage = useRef(false);
  
  // Navigation lock to prevent concurrent navigation
  const navigationLockRef = useRef(false);
  const navigationQueueRef = useRef<Array<() => void>>([]);
  
  // Track previous page info to prevent unnecessary re-renders
  const pageInfoRef = useRef<PageInfo>({ current: 0, total: 0 });
  const pageChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(String(pageInfo.current));
  }, [pageInfo]);

  // Safe navigation wrapper to prevent concurrent navigation
  const safeNavigate = useCallback(async (navigationFn: () => void | Promise<void>) => {
    if (navigationLockRef.current) {
      // Queue navigation if one is in progress
      navigationQueueRef.current.push(navigationFn);
      return;
    }

    try {
      navigationLockRef.current = true;
      await navigationFn();
    } catch (err) {
      logger.error('Navigation error:', err);
    } finally {
      navigationLockRef.current = false;
      
      // Process queued navigation
      const nextNav = navigationQueueRef.current.shift();
      if (nextNav) {
        safeNavigate(nextNav);
      }
    }
  }, []);

  // Go to specific page
  const goToPage = useCallback(
    (page: number) => {
      const rendition = renditionRef.current;
      if (!rendition || !locationsReady) return;

      const locations = rendition.book.locations;
      if (!locations || typeof locations.cfiFromLocation !== 'function') return;

      const targetPage = Math.max(1, Math.min(page, pageInfo.total));
      
      safeNavigate(async () => {
        try {
          const cfi = locations.cfiFromLocation(targetPage - 1);
          if (cfi) {
            await rendition.display(cfi).catch((err: Error) => {
              logger.error('Display error:', err.message);
            });
          }
        } catch (err) {
          logger.error('Failed to navigate to page:', err);
        }
      });
    },
    [renditionRef, locationsReady, pageInfo.total, safeNavigate]
  );

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    safeNavigate(async () => {
      try {
        await rendition.next().catch((err: Error) => {
          logger.error('Next page error:', err.message);
        });
      } catch (err) {
        logger.error('Failed to go to next page:', err);
      }
    });
  }, [renditionRef, safeNavigate]);

  // Navigate to previous page
  const goToPrevPage = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    safeNavigate(async () => {
      try {
        await rendition.prev().catch((err: Error) => {
          logger.error('Previous page error:', err.message);
        });
      } catch (err) {
        logger.error('Failed to go to previous page:', err);
      }
    });
  }, [renditionRef, safeNavigate]);

  // Navigate to TOC item
  const navigateToTocItem = useCallback(
    (href: string) => {
      const rendition = renditionRef.current;
      if (!rendition) return;

      safeNavigate(async () => {
        try {
          await rendition.display(href).catch((err: Error) => {
            logger.error('TOC navigation error:', err.message);
          });
        } catch (err) {
          logger.error('Failed to navigate to TOC item:', err);
        }
      });
    },
    [renditionRef, safeNavigate]
  );

  // Navigate to CFI location
  const navigateToCfi = useCallback(
    (cfi: string) => {
      const rendition = renditionRef.current;
      if (!rendition) return;

      safeNavigate(async () => {
        try {
          await rendition.display(cfi).catch((err: Error) => {
            logger.error('CFI navigation error:', err.message);
          });
        } catch (err) {
          logger.error('Failed to navigate to CFI:', err);
        }
      });
    },
    [renditionRef, safeNavigate]
  );

  // Handle page input submit
  const handlePageInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      
      const pageNumber = parseInt(pageInput, 10);
      if (isNaN(pageNumber)) {
        setPageInput(String(pageInfo.current));
        return;
      }

      if (pageNumber < 1 || pageNumber > pageInfo.total) {
        setPageInput(String(pageInfo.current));
        return;
      }

      goToPage(pageNumber);
    },
    [pageInput, pageInfo, goToPage]
  );

  // Handle location change
  const handleLocationChange = useCallback(
    (epubcfi: string) => {
      const rendition = renditionRef.current;
      if (!rendition) return;

      setLocation(epubcfi);

      // Try to get page numbers from locations if available
      const locations = rendition.book.locations;
      if (locations && typeof locations.length === 'function') {
        try {
          const totalLocations = locations.length();
          if (totalLocations > 0 && typeof locations.locationFromCfi === 'function') {
            try {
              const currentLocation = locations.locationFromCfi(epubcfi);

              if (typeof currentLocation === 'number' && currentLocation >= 0) {
                const newPageInfo = {
                  current: currentLocation + 1,
                  total: totalLocations,
                };

                // Debounce page change callback to parent
                if (pageChangeDebounceRef.current) {
                  clearTimeout(pageChangeDebounceRef.current);
                }

                // Only call parent callback if page actually changed
                if (
                  pageInfoRef.current.current !== newPageInfo.current ||
                  pageInfoRef.current.total !== newPageInfo.total
                ) {
                  pageInfoRef.current = newPageInfo;
                  setPageInfo(newPageInfo);

                  // Do not report page changes to parent until we have restored the initial page
                  // This prevents overwriting the saved page with page 1 during initialization
                  if (!hasNavigatedToInitialPage.current && initialPage > 1) {
                    logger.log('Skipping page change report during initialization', {
                      current: newPageInfo.current,
                      initialPage
                    });
                    return;
                  }

                  pageChangeDebounceRef.current = setTimeout(() => {
                    onPageChange?.(newPageInfo.current, newPageInfo.total);
                  }, 300);
                }
              }
            } catch (cfiError) {
              // Silently ignore CFI parsing errors - locations might not be ready
              logger.debug('CFI location error (expected during initialization):', cfiError);
            }
          } else {
            // Fallback: Use displayed page info when locations not available
            try {
              const displayed = rendition.location.start.displayed;
              if (displayed && typeof displayed.page === 'number' && typeof displayed.total === 'number') {
                const newPageInfo = {
                  current: displayed.page,
                  total: displayed.total,
                };

                if (
                  pageInfoRef.current.current !== newPageInfo.current ||
                  pageInfoRef.current.total !== newPageInfo.total
                ) {
                  pageInfoRef.current = newPageInfo;
                  setPageInfo(newPageInfo);

                  // Do not report page changes to parent until we have restored the initial page
                  if (!hasNavigatedToInitialPage.current && initialPage > 1) {
                    return;
                  }

                  if (pageChangeDebounceRef.current) {
                    clearTimeout(pageChangeDebounceRef.current);
                  }

                  pageChangeDebounceRef.current = setTimeout(() => {
                    onPageChange?.(newPageInfo.current, newPageInfo.total);
                  }, 300);
                }
              }
            } catch (displayedError) {
              logger.debug('Error getting displayed page info:', displayedError);
            }
          }
        } catch (err) {
          logger.error('Error getting location info:', err);
        }
      }

      // Update current chapter by matching href with TOC
      try {
        const { href } = rendition.location.start;
        const chapter = (rendition.book.navigation.toc as NavItem[]).find(
          (item) => item.href === href
        );
        if (chapter?.label) {
          setCurrentChapter(chapter.label);
        }
      } catch (err) {
        logger.error('Error getting current chapter:', err);
      }
    },
    [renditionRef, onPageChange, initialPage]
  );

  // PERFORMANCE FIX: Chunked location generation to prevent UI blocking
  // Generate locations in chunks to keep the UI responsive during processing
  const generateLocations = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (book: any) => {
      try {
        setIsGeneratingLocations(true);
        setLocationGenerationProgress(0);

        const totalSpineItems = book.spine.length;
        
        logger.log('Starting location generation for', { totalSpineItems });

        // Generate locations with progress tracking
        // Note: EPUB.js generate() doesn't natively support chunking,
        // but we can at least provide progress feedback and yield to UI
        await new Promise<void>((resolve, reject) => {
          // Start generation
          book.locations
            .generate(1600)
            .then(() => {
              setLocationGenerationProgress(100);
              const totalLocations = book.locations.length();
              logger.log('Generated locations for book:', { totalLocations });
              
              // Update page info with total locations
              if (totalLocations > 0) {
                setPageInfo(prev => ({
                  ...prev,
                  total: totalLocations,
                }));
                pageInfoRef.current = {
                  ...pageInfoRef.current,
                  total: totalLocations,
                };
              }
              
              // Callback to update highlights with page numbers now that locations are generated
              if (onLocationsGenerated) {
                onLocationsGenerated(book);
              }
              
              // Mark locations as ready for initial page navigation
              setLocationsReady(true);
              
              resolve();
            })
            .catch((error: Error) => {
              logger.error('Error generating locations:', error);
              reject(error);
            });

          // Simulate progress updates while generation happens
          // This provides user feedback even though the actual generation is still blocking
          // In a future enhancement, this could be moved to a Web Worker
          const progressInterval = setInterval(() => {
            setLocationGenerationProgress((prev) => {
              if (prev >= 95) {
                clearInterval(progressInterval);
                return prev;
              }
              // Increase progress gradually (simulated)
              return prev + 5;
            });
          }, 200);
        });

        setIsGeneratingLocations(false);
        setLocationGenerationProgress(0);
      } catch (error) {
        logger.error('Error in chunked location generation:', error);
        setIsGeneratingLocations(false);
        setLocationGenerationProgress(0);
      }
    },
    [onLocationsGenerated]
  );

  // Navigate to initial page
  const navigateToInitialPage = useCallback(
    (page: number) => {
      if (hasNavigatedToInitialPage.current || !locationsReady) return;
      
      hasNavigatedToInitialPage.current = true;
      if (page > 1) {
        goToPage(page);
      }
    },
    [locationsReady, goToPage]
  );

  return {
    // State
    location,
    toc,
    currentChapter,
    pageInfo,
    pageInput,
    isGeneratingLocations,
    locationGenerationProgress,
    locationsReady,
    
    // Setters
    setLocation,
    setToc,
    setCurrentChapter,
    setPageInfo,
    setPageInput,
    setLocationsReady,
    
    // Actions
    goToPage,
    goToNextPage,
    goToPrevPage,
    navigateToTocItem,
    navigateToCfi,
    handlePageInputSubmit,
    handleLocationChange,
    generateLocations,
    navigateToInitialPage,
    safeNavigate,
  };
}
