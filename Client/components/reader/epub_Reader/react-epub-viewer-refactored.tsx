'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import type { Rendition, NavItem, Contents } from 'epubjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  X,
  Maximize,
  Minimize,
  Bookmark,
  BookmarkPlus,
  List,
  Highlighter,
  Search,
  Volume2,
  Settings,
  Eye,
  EyeOff,
  Type,
} from 'lucide-react';

// Component imports
import BookmarkForm from '../bookmark-form';
import ContentsAndBookmarksPanel from './ContentsAndBookmarksPanel';
import EpubHighlightsPanel from './EpubHighlightsPanel';
import ColorPickerPopup from './ColorPickerPopup';
import EpubSearchPanel from './EpubSearchPanel';
import EpubColorFilterPanel from './EpubColorFilterPanel';
import EpubTTSPanel from './EpubTTSPanel';
import DisplayOptionsPanel from './DisplayOptionsPanel';
import MobileOptionsPanel from './MobileOptionsPanel';
import TranslationPopup from '../TranslationPopup';
import DictionaryPopup from '../DictionaryPopup';
import { logger } from '@/lib/logger';
import { useToast, ToastContainer } from '@/components/ui/toast';

// Custom hooks imports
import {
  useEpubBookmarks,
  useEpubHighlights,
  useEpubNavigation,
  useEpubTTS,
  useEpubSearch,
  useEpubDisplayOptions,
  useEpubAnalytics,
} from './hooks';
import { useReadingMode } from '@/hooks/useReadingMode';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { Progress } from '@/components/ui/progress';

interface ReactEpubViewerProps {
  fileUrl: string;
  bookId: string;
  currentPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onClose?: () => void;
}

// Custom styles for the reader
const getReaderStyles = (colorFilter: string, customBgColor: string) => {
  let backgroundColor = '#ffffff';

  if (colorFilter === 'sepia') {
    backgroundColor = '#f4ecd8';
  } else if (colorFilter === 'dark') {
    backgroundColor = '#1a1a1a';
  } else if (colorFilter === 'custom') {
    backgroundColor = customBgColor;
  }

  return {
    container: {
      overflow: 'hidden',
      position: 'relative' as const,
      height: '100%',
    },
    readerArea: {
      position: 'relative' as const,
      zIndex: 1,
      height: '100%',
      width: '100%',
      backgroundColor: backgroundColor,
      transition: 'all .3s ease',
    },
    containerExpanded: {},
    titleArea: {
      display: 'none',
    },
    reader: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
    swipeWrapper: {},
    prev: {
      left: 10,
    },
    next: {
      right: 10,
    },
    arrow: {
      display: 'none',
      outline: 'none',
      border: 'none',
      background: 'none',
      position: 'absolute' as const,
      top: '50%',
      marginTop: -32,
      fontSize: 64,
      padding: '0 10px',
      color: '#E2E2E2',
      fontFamily: 'arial, sans-serif',
      cursor: 'pointer',
      userSelect: 'none' as const,
    },
    arrowHover: {},
    toc: {},
    tocBackground: {},
    tocArea: {
      background: backgroundColor,
    },
    tocAreaButton: {},
    tocButton: {
      background: 'none',
      border: 'none',
      width: 32,
      height: 32,
      position: 'absolute' as const,
      top: 10,
      left: 10,
      cursor: 'pointer',
    },
    tocButtonExpanded: {},
    tocButtonBar: {},
    tocButtonBarTop: {},
    tocButtonBottom: {},
    loadingView: {},
    errorView: {},
  };
};

export default function ReactEpubViewer({
  fileUrl,
  bookId,
  currentPage,
  onPageChange,
  onClose,
}: ReactEpubViewerProps) {
  // Core state
  const renditionRef = useRef<Rendition | undefined>(undefined);
  const [bookTitle, setBookTitle] = useState('EPUB Book');
  const [toc, setToc] = useState<NavItem[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  
  // Touch handler state refs
  const touchStartYRef = useRef(0);
  const touchAccumulatorRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const lastTouchMoveTimeRef = useRef(0);
  const TOUCH_SCROLL_THRESHOLD = 70; // Pixels to scroll before turning page
  const TOUCH_COOLDOWN = 150; // Minimum ms between page turns
  const TOUCH_MOVE_THROTTLE = 8; // ~120fps throttle for touchmove events (8ms = 1000/120)
  
  // Toast notifications
  const { toasts, closeToast, success, error } = useToast();

  // Get access token for API calls
  const { getAccessToken } = useAuthToken();

  // Initialize highlights hook first (needed by navigation hook)
  const highlights = useEpubHighlights({
    bookId,
    renditionRef,
    onSuccess: success,
    onError: error,
  });

  // Initialize navigation hook with callback to update highlight page numbers
  const navigation = useEpubNavigation({
    renditionRef,
    onPageChange,
    onLocationsGenerated: highlights.updateHighlightPageNumbers,
    initialPage: currentPage,
  });

  const bookmarks = useEpubBookmarks({
    bookId,
    onSuccess: success,
    onError: error,
  });

  const tts = useEpubTTS({
    renditionRef,
    safeNavigate: navigation.safeNavigate,
    onSuccess: success,
    onError: error,
  });

  const search = useEpubSearch({
    renditionRef,
  });

  const displayOptions = useEpubDisplayOptions({
    renditionRef,
    bookId,
    onFontChange: highlights.reapplyHighlights, // Reapply highlights when font changes
  });

  // Initialize analytics hook for reading session tracking
  useEpubAnalytics({
    bookId,
    currentPage,
    pageInfo: navigation.pageInfo,
    getAccessToken,
  });

  // Panel states
  const [showContentsAndBookmarks, setShowContentsAndBookmarks] = useState(false);
  const [showHighlightsPanel, setShowHighlightsPanel] = useState(false);
  
  // Translation state
  const [translationState, setTranslationState] = useState<{
    isOpen: boolean;
    text: string;
    position?: { x: number; y: number };
  }>({
    isOpen: false,
    text: '',
  });

  const [dictionaryState, setDictionaryState] = useState<{
    isOpen: boolean;
    text: string;
    position?: { x: number; y: number };
  }>({
    isOpen: false,
    text: '',
  });

  // Text selection toggle
  const [enableTextSelection, setEnableTextSelection] = useState(false);

  // Reading mode: Auto-hide toolbar on desktop and mobile
  const { readingMode, setReadingMode, toolbarVisible } = useReadingMode({
    bookId,
    enabled: true, // Enable reading mode on all devices
  });

  // Load bookmarks and highlights on mount
  useEffect(() => {
    logger.log('Loading bookmarks and highlights...');
    bookmarks.loadBookmarks();
    highlights.loadHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debug bookmarks loading
  useEffect(() => {
    logger.log('Bookmarks state changed:', {
      count: bookmarks.bookmarks.length,
      isLoading: bookmarks.isLoadingBookmarks,
      bookmarks: bookmarks.bookmarks
    });
  }, [bookmarks.bookmarks, bookmarks.isLoadingBookmarks]);

  // Track mobile view for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoized touch handlers using useCallback
  const handleTouchStart = useCallback((event: globalThis.TouchEvent) => {
    if (event.touches.length === 1) {
      touchStartYRef.current = event.touches[0].clientY;
      touchAccumulatorRef.current = 0; // Reset accumulator on new touch
    }
  }, []);

  const handleTouchMove = useCallback((event: globalThis.TouchEvent) => {
    if (event.touches.length === 1) {
      const now = Date.now();
      
      // Throttle touchmove events to improve performance (~60fps)
      if (now - lastTouchMoveTimeRef.current < TOUCH_MOVE_THROTTLE) {
        return;
      }
      
      lastTouchMoveTimeRef.current = now;
      const currentY = event.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY; // Calculate vertical movement
      touchAccumulatorRef.current += deltaY;
      touchStartYRef.current = currentY; // Update start position for continuous tracking
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const now = Date.now();

    // Cooldown check - prevent too rapid page changes
    if (now - lastTouchTimeRef.current < TOUCH_COOLDOWN) {
      return;
    }

    // Check if we've scrolled enough to turn page
    if (Math.abs(touchAccumulatorRef.current) >= TOUCH_SCROLL_THRESHOLD) {
      if (touchAccumulatorRef.current > 0) {
        // Scrolling down = next page
        // Use safeNavigate wrapper
        navigation.safeNavigate(() => {
          renditionRef.current?.next();
          logger.log('Touch scroll next page');
        });
        lastTouchTimeRef.current = now;
      } else {
        // Scrolling up = previous page
        // Use safeNavigate wrapper
        navigation.safeNavigate(() => {
          renditionRef.current?.prev();
          logger.log('Touch scroll previous page');
        });
        lastTouchTimeRef.current = now;
      }
    }
  }, [navigation]);

  // Track mobile view for responsive layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Inject CSS for SVG highlight transparency and set up MutationObserver
  useEffect(() => {
    const styleId = 'epub-highlight-styles';
    
    // Check if style already exists
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* SVG highlight overlays - apply transparency */
        svg g.hl {
          opacity: 0.2 !important;
        }
        svg g.hl rect {
          opacity: 1 !important;
        }
        svg g.hl polygon {
          opacity: 1 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Set up MutationObserver to handle highlight opacity
    let observer: MutationObserver | null = null;
    let observerTarget: Element | null = null;
    
    const setupObserver = () => {
      // Try to find the EPUB container
      const epubContainer = document.querySelector('.epub-container') 
        || document.querySelector('[class*="epub"]')
        || document.querySelector('[class*="ReactReader"]')
        || document.querySelector('main');
      
      if (!epubContainer || observerTarget === epubContainer) {
        return;
      }
      
      observerTarget = epubContainer;
      
      // Disconnect existing observer if any
      if (observer) {
        observer.disconnect();
      }
      
      // Create new observer scoped to EPUB container
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as Element;
              
              // Process highlight SVGs
              if (element.tagName === 'svg' && element.querySelector('g.hl')) {
                const hlGroups = element.querySelectorAll('g.hl');
                hlGroups.forEach((group) => {
                  group.removeAttribute('fill-opacity');
                });
              } else if (element.querySelector('svg g.hl')) {
                const svgElements = Array.from(element.querySelectorAll('svg'));
                svgElements.forEach((svg) => {
                  const hlGroups = svg.querySelectorAll('g.hl');
                  if (hlGroups.length > 0) {
                    hlGroups.forEach((group) => {
                      group.removeAttribute('fill-opacity');
                    });
                  }
                });
              }
            }
          });
        });
      });
      
      // Observe the EPUB container
      observer.observe(epubContainer, {
        childList: true,
        subtree: true,
      });
    };
    
    // Try to set up observer immediately
    setupObserver();
    
    // Retry after a delay in case container isn't ready
    const retryTimer = setTimeout(() => {
      setupObserver();
    }, 1000);
    
    // Cleanup
    return () => {
      clearTimeout(retryTimer);
      if (observer) {
        observer.disconnect();
      }
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Navigate to initial page when locations are ready
  useEffect(() => {
    if (currentPage && navigation.locationsReady) {
      navigation.navigateToInitialPage(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, navigation.locationsReady]);

  // Apply font settings when they change
  useEffect(() => {
    if (renditionRef.current) {
      displayOptions.applyFontSettings();
      // No need to manually reapply highlights - the 'rendered' listener will handle it automatically
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displayOptions.fontSize,
    displayOptions.fontFamily,
    displayOptions.lineHeight,
  ]);

  // Apply color theme when it changes
  useEffect(() => {
    if (renditionRef.current) {
      displayOptions.applyColorTheme(renditionRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayOptions.colorFilter, displayOptions.customBgColor]);

  // Set up rendition when book loads
  const getRendition = useCallback((rendition: Rendition) => {
    renditionRef.current = rendition;

    // Add global error handler for rendition
    rendition.on('displayError', (err: Error) => {
      logger.error('Rendition display error (caught):', err.message);
    });

    // Wrap rendition.display to catch "No Section Found" errors
    const originalDisplay = rendition.display.bind(rendition);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rendition.display = function(target?: any): Promise<void> {
      return originalDisplay(target).catch((err: Error) => {
        if (err.message.includes('No Section Found')) {
          logger.warn('Navigation to invalid section skipped:', err.message);
          // Return resolved promise instead of null
          return Promise.resolve();
        }
        throw err;
      });
    };

    // Set up event listeners
    rendition.on('relocated', navigation.handleLocationChange);
    // Note: 'selected' event is conditionally registered via useEffect based on enableTextSelection state

    // Apply initial settings
    displayOptions.applyFontSettings();
    displayOptions.applyColorTheme(rendition);

    // Configure iframe sandbox with minimal required permissions
    // This provides a secure reading environment while maintaining functionality
    rendition.hooks.content.register((contents: Contents) => {
      const iframe = contents.document.defaultView?.frameElement as HTMLIFrameElement;
      
      if (iframe) {
        // Set restrictive sandbox policy
        // Only allow what's absolutely necessary for EPUB rendering
        iframe.setAttribute(
          'sandbox',
          'allow-same-origin' // Required for EPUB.js to access iframe content
          // Note: NOT including 'allow-scripts' by default for security
          // EPUB content scripts will be blocked unless explicitly needed
        );

        // Add Content Security Policy for additional protection
        // SECURITY: Remove any existing CSP first to prevent malicious EPUB override
        const existingCsp = contents.document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (existingCsp) {
          logger.warn('Removing existing CSP from EPUB (potential security bypass attempt)');
          existingCsp.remove();
        }
        
        const cspMeta = contents.document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = [
          "default-src 'none'", // Deny all by default
          "style-src 'self' 'unsafe-inline'", // Allow inline styles (needed for EPUB)
          "img-src 'self' data: blob:", // Allow images from same origin, data URLs, and blobs
          "font-src 'self' data:", // Allow fonts
          "media-src 'self' blob:", // Allow audio/video
          "script-src 'none'", // Block all scripts for security
        ].join('; ');
        
        // SECURITY: Always enforce CSP, regardless of existing policy
        if (contents.document.head) {
          contents.document.head.appendChild(cspMeta);
        }

        // Remove any potentially dangerous elements
        const dangerousElements = contents.document.querySelectorAll('script, object, embed, applet');
        dangerousElements.forEach(el => {
          logger.warn('Removed potentially dangerous element from EPUB:', el.tagName);
          el.remove();
        });
      }

      // SCROLL-BASED PAGE NAVIGATION: Add wheel event listener to iframe content
      // This is the most reliable place to capture scroll events in EPUB content
      // Track listener for proper cleanup
      let scrollAccumulator = 0;
      const scrollThreshold = 100; // Pixels to scroll before turning page
      let lastScrollTime = 0;
      const scrollCooldown = 150; // Minimum ms between page turns

      const handleContentWheel = (event: globalThis.WheelEvent) => {
        const now = Date.now();
        
        // Prevent default scroll behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Cooldown check - prevent too rapid page changes
        if (now - lastScrollTime < scrollCooldown) {
          return;
        }

        // Accumulate scroll delta
        scrollAccumulator += event.deltaY;

        // Check if we've scrolled enough to turn page
        if (Math.abs(scrollAccumulator) >= scrollThreshold) {
          if (scrollAccumulator > 0) {
            // Scrolling down = next page
            // Use safeNavigate wrapper
            navigation.safeNavigate(() => {
              rendition.next();
              logger.log('Scroll next page');
            });
            lastScrollTime = now;
            scrollAccumulator = 0;
          } else {
            // Scrolling up = previous page
            // Use safeNavigate wrapper
            navigation.safeNavigate(() => {
              rendition.prev();
              logger.log('Scroll previous page');
            });
            lastScrollTime = now;
            scrollAccumulator = 0;
          }
        }
      };

      // Attach wheel listener to iframe content
      if (contents.document) {
        contents.document.addEventListener('wheel', handleContentWheel, { passive: false });
        logger.log('Scroll navigation attached to EPUB content');
      }

      // TOUCH SCROLL NAVIGATION: Add touch event listeners for mobile devices
      // Use memoized handlers from component scope
      if (contents.document) {
        contents.document.addEventListener('touchstart', handleTouchStart, { passive: true });
        contents.document.addEventListener('touchmove', handleTouchMove, { passive: true });
        contents.document.addEventListener('touchend', handleTouchEnd, { passive: true });
        logger.log('Touch scroll navigation attached to EPUB content');
      }

      // Clean up scroll listener when content is unloaded
      // This happens when navigating to a new chapter/page
      contents.on('unloaded', () => {
        if (contents.document) {
          contents.document.removeEventListener('wheel', handleContentWheel);
          contents.document.removeEventListener('touchstart', handleTouchStart);
          contents.document.removeEventListener('touchmove', handleTouchMove);
          contents.document.removeEventListener('touchend', handleTouchEnd);
          logger.log('Scroll and touch navigation cleaned up from EPUB content');
        }
      });

      // Inject CSS to ensure highlight transparency works
      const style = contents.document.createElement('style');
      style.textContent = `
        .hl {
          opacity: 0.2 !important;
          mix-blend-mode: multiply !important;
        }
        svg.hl rect {
          opacity: 0.2 !important;
          mix-blend-mode: multiply !important;
        }
      `;
      contents.document.head.appendChild(style);
    });

    // Defer location generation
    // This reduces perceived loading time by 300-500ms
    // Book appears to user immediately, then locations are generated in the background

    // Get book metadata
    rendition.book.ready.then(() => {
      // Get book title
      const title = rendition.book.packaging?.metadata?.title || 'EPUB Book';
      setBookTitle(title);

      // Get table of contents
      rendition.book.loaded.navigation.then((nav) => {
        logger.log('Navigation loaded:', nav);
        logger.log('TOC raw:', nav.toc);
        logger.log('TOC length:', nav.toc?.length);
        setToc(nav.toc);
      }).catch((err) => {
        logger.error('Error loading navigation:', err);
      });

      // Defer location generation
      // Generate locations in background after book is displayed
      // This allows user to start reading immediately while progress tracking loads
      setTimeout(() => {
        logger.log('Starting deferred location generation...');
        navigation.generateLocations(rendition.book);
      }, 500);
    });
  }, [navigation, displayOptions, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tts.stopSpeaking();
      search.cancelSearch();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply text selection setting to rendition
  useEffect(() => {
    if (!renditionRef.current) return;

    const rendition = renditionRef.current;

    if (enableTextSelection) {
      // Enable text selection for highlights
      rendition.on('selected', highlights.handleTextSelected);
    } else {
      // Disable text selection
      rendition.off('selected', highlights.handleTextSelected);
    }

    // Cleanup on unmount or when enableTextSelection changes
    return () => {
      rendition.off('selected', highlights.handleTextSelected);
    };
  }, [enableTextSelection, highlights.handleTextSelected]);

  // Helper functions
  const currentPageBookmark = bookmarks.getPageBookmark(navigation.pageInfo.current);
  const isCurrentPageBookmarked = !!currentPageBookmark;

  const decreaseRotation = () => {
    for (let i = 0; i < 3; i++) {
      displayOptions.rotatePage();
    }
  };

  // Toggle bookmark for current page
  const toggleBookmark = async () => {
    if (isCurrentPageBookmarked && currentPageBookmark) {
      try {
        await bookmarks.handleDeleteBookmark(currentPageBookmark.id);
      } catch (err) {
        logger.error('Error deleting bookmark:', err);
        // Error is already handled by the hook
      }
    } else {
      bookmarks.setShowBookmarkForm(true);
    }
  };

  // Handle bookmark form submission
  const handleBookmarkSubmit = async (note: string) => {
    if (bookmarks.editingBookmark) {
      await bookmarks.updateExistingBookmark(bookmarks.editingBookmark.id, note);
    } else {
      await bookmarks.createNewBookmark(
        navigation.pageInfo.current,
        navigation.location as string,
        note
      );
    }
  };

  const readerStyles = getReaderStyles(displayOptions.colorFilter, displayOptions.customBgColor);

  // Calculate reading progress
  const progress = navigation.pageInfo.total > 0 
    ? (navigation.pageInfo.current / navigation.pageInfo.total) * 100 
    : 0;

  return (
    <div 
      className="fixed inset-0 flex flex-col z-50"
      style={{ backgroundColor: readerStyles.readerArea.backgroundColor }}
    >
      {/* Header Toolbar - Auto-hides in reading mode */}
      {(!readingMode || toolbarVisible) && (
        <div className="absolute top-0 left-0 right-0 z-40 transition-all duration-300 transform translate-y-0">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              {/* Left Section - Title */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h1 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                  {bookTitle}
                </h1>
                {navigation.currentChapter && (
                  <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 truncate border-l border-gray-300 dark:border-gray-600 pl-3 ml-1">
                    {navigation.currentChapter}
                  </span>
                )}
              </div>

              {/* Center Section - Navigation (Desktop Only) */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={navigation.pageInfo.current <= 1}
                  onClick={navigation.goToPrevPage}
                  title="Previous page"
                  className="h-8 w-8 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Input */}
                <div className="flex items-center gap-2 px-2">
                  <form onSubmit={navigation.handlePageInputSubmit} className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={navigation.pageInput}
                      onChange={(e) => navigation.setPageInput(e.target.value)}
                      min={1}
                      max={navigation.pageInfo.total}
                      className="w-12 text-center h-7 text-sm border-none bg-transparent focus-visible:ring-0 p-0"
                      disabled={navigation.pageInfo.total === 0}
                    />
                    <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
                      / {navigation.pageInfo.total}
                    </span>
                  </form>
              {navigation.isGeneratingLocations && (
                <div className="flex flex-col gap-1 ml-2 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Calculating pages...
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {navigation.locationGenerationProgress}%
                    </span>
                  </div>
                  <Progress 
                    value={navigation.locationGenerationProgress} 
                    className="h-1 w-full"
                  />
                </div>
              )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigation.goToNextPage}
                  disabled={navigation.pageInfo.current >= navigation.pageInfo.total}
                  title="Next page"
                  className="h-8 w-8 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Right Section - Essential Controls */}
              <div className="flex items-center gap-1 sm:gap-2">

                {/* Search - Always visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={search.toggleSearchPanel}
                  title="Search"
                  className={`h-9 w-9 rounded-lg transition-all ${search.showSearchPanel ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* Bookmark Controls - Always visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleBookmark}
                  disabled={bookmarks.isLoadingBookmarks}
                  title={isCurrentPageBookmarked ? "Remove bookmark" : "Add bookmark"}
                  className={`h-9 w-9 rounded-lg transition-all ${isCurrentPageBookmarked ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  {isCurrentPageBookmarked ? (
                    <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                  ) : (
                    <BookmarkPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>

                {/* Contents & Bookmarks Panel - Always visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowContentsAndBookmarks(!showContentsAndBookmarks)}
                  disabled={bookmarks.isLoadingBookmarks}
                  title="Contents & Bookmarks"
                  className={`h-9 w-9 rounded-lg transition-all ${showContentsAndBookmarks ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <List className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* Highlights Panel - Always visible */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
                  disabled={highlights.highlights.length === 0}
                  title="Highlights"
                  className={`h-9 w-9 rounded-lg transition-all ${showHighlightsPanel ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                >
                  <Highlighter className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                {/* Desktop Advanced Features */}
                <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
                  
                  {/* Display Options Panel Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={displayOptions.toggleDisplayOptions}
                    title="Display options"
                    className={`h-9 w-9 rounded-lg transition-all ${displayOptions.showDisplayOptions ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <Settings className="h-5 w-5" />
                  </Button>

                  {/* Text-to-Speech */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={tts.toggleTTSControls}
                    title="Text-to-Speech"
                    className={`h-9 w-9 rounded-lg transition-all ${tts.showTTSControls ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>

                  {/* Text Selection Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEnableTextSelection(!enableTextSelection)}
                    title={enableTextSelection ? "Disable text selection" : "Enable text selection"}
                    className={`h-9 w-9 rounded-lg transition-all ${enableTextSelection ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <Type className="h-5 w-5" />
                  </Button>

                  {/* Reading Mode Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReadingMode(!readingMode)}
                    title={readingMode ? "Exit reading mode (R)" : "Enter reading mode (R)"}
                    className={`h-9 w-9 rounded-lg transition-all ${readingMode ? "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {readingMode ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>

                </div>

                {/* Mobile More Options Menu */}
                <div className="flex lg:hidden items-center gap-1 pl-1 border-l border-gray-200 dark:border-gray-700 ml-1">
                  {/* More Options Button - Mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileOptions(!showMobileOptions)}
                    title="More options"
                    className="h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                  
                {/* Fullscreen button - Tablet and up */}
                <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
                  {/* Fullscreen Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={displayOptions.toggleFullscreen}
                    className={`h-9 w-9 rounded-lg transition-all ${displayOptions.isFullscreen ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {displayOptions.isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {/* Close Reader - Always visible */}
                {onClose && (
                  <div className="">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      title="Close"
                      className="h-9 w-9 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar - Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main reader area */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center pt-16 pb-16 sm:pb-0">
        <div 
          style={{ 
            height: '100%',
            width: isMobileView ? '100%' : (displayOptions.pageLayout === 'single' ? '50%' : '100%'),
            maxWidth: displayOptions.pageLayout === 'single' ? '800px' : 'none',
            transition: 'width 0.3s ease-in-out',
          }}
        >
          <ReactReader
            url={fileUrl}
            location={navigation.location}
            locationChanged={navigation.handleLocationChange}
            getRendition={getRendition}
            showToc={false}
            readerStyles={getReaderStyles(displayOptions.colorFilter, displayOptions.customBgColor)}
            epubOptions={{
              flow: 'paginated',
              manager: 'default',
              snap: true,
              spread: displayOptions.pageLayout === 'double' ? 'auto' : 'none',
              allowScriptedContent: false,
            }}
          />
        </div>

        {/* Panels - Inside reader area container for proper positioning */}
        {showContentsAndBookmarks && (
          <>
            {/* Overlay */}
            <div
              className="absolute inset-0"
              onClick={() => setShowContentsAndBookmarks(false)}
            />
            {/* Panel */}
            <ContentsAndBookmarksPanel
              toc={toc}
              bookmarks={bookmarks.bookmarks}
              isLoadingBookmarks={bookmarks.isLoadingBookmarks}
              currentPage={navigation.pageInfo.current}
              onTocItemClick={(href) => {
                logger.log('TOC item clicked:', href);
                navigation.navigateToTocItem(href);
                if (isMobileView) setShowContentsAndBookmarks(false);
              }}
              onJumpToPage={(pageNumber: number) => {
                logger.log('Jump to page:', pageNumber);
                navigation.goToPage(pageNumber);
                if (isMobileView) setShowContentsAndBookmarks(false);
              }}
              onEditBookmark={bookmarks.handleEditBookmark}
              onDeleteBookmark={bookmarks.handleDeleteBookmark}
              onClose={() => setShowContentsAndBookmarks(false)}
            />
          </>
        )}

        {showHighlightsPanel && (
          <EpubHighlightsPanel
            highlights={highlights.highlights.map(h => ({
              id: h.id,
              text: h.text || '',
              cfiRange: h.cfiRange,
              color: h.color,
              hex: h.hex || '',
              note: h.note,
              createdAt: h.createdAt,
              pageNumber: h.pageNumber,
            }))}
            onJumpToHighlight={(cfiRange) => {
              highlights.jumpToHighlight(cfiRange);
              setShowHighlightsPanel(false); // Always close panel like original
            }}
            onRemoveHighlight={highlights.removeHighlight}
            onChangeColor={highlights.initiateColorChange}
            onSaveNote={highlights.saveHighlightNote}
            onTranslate={(text) => {
              setTranslationState({
                isOpen: true,
                text: text,
                position: undefined
              });
            }}
            onDefine={(text) => {
              setDictionaryState({
                isOpen: true,
                text: text,
                position: undefined
              });
            }}
            onClose={() => setShowHighlightsPanel(false)}
          />
        )}

        {/* Search Panel */}
        {search.showSearchPanel && (
          <EpubSearchPanel
            searchQuery={search.searchQuery}
            onSearchQueryChange={search.setSearchQuery}
            onSearch={search.handleSearch}
            searchResults={search.searchResults}
            currentSearchIndex={search.currentSearchIndex}
            onPrev={search.goToPrevSearchResult}
            onNext={search.goToNextSearchResult}
            onSelectResult={(index) => search.goToSearchResult(index)}
            onClear={search.clearSearch}
            onClose={search.toggleSearchPanel}
            isSearching={search.isSearching}
            searchProgress={search.searchProgress}
            onCancelSearch={search.cancelSearch}
          />
        )}

        {/* Color Filter Panel */}
        {displayOptions.showColorFilter && (
          <EpubColorFilterPanel
            colorFilter={displayOptions.colorFilter}
            customBgColor={displayOptions.customBgColor}
            setColorFilter={displayOptions.setColorFilter}
            setCustomBgColor={displayOptions.setCustomBgColor}
            onClose={displayOptions.toggleColorFilter}
          />
        )}

        {/* TTS Control Panel */}
        {tts.showTTSControls && (
          <>
            {/* Overlay */}
            <div
              className="absolute inset-0"
              onClick={tts.toggleTTSControls}
            />
            <EpubTTSPanel
              availableVoices={tts.availableVoices}
              selectedVoice={tts.selectedVoice}
              setSelectedVoice={tts.setSelectedVoice}
              speechRate={tts.speechRate}
              setSpeechRate={tts.setSpeechRate}
              speechPitch={tts.speechPitch}
              setSpeechPitch={tts.setSpeechPitch}
              speechVolume={tts.speechVolume}
              setSpeechVolume={tts.setSpeechVolume}
              isSpeaking={tts.isSpeaking}
              isPaused={tts.isPaused}
              toggleTextToSpeech={() => {
                // Get current page text and start speaking
                // Start/pause/resume TTS
                if (tts.isSpeaking) {
                  tts.pauseSpeaking();
                } else if (tts.isPaused) {
                  tts.resumeSpeaking();
                } else {
                  tts.startSpeaking();
                }
              }}
              stopTextToSpeech={tts.stopSpeaking}
              onClose={tts.toggleTTSControls}
              voicesLoading={tts.voicesLoading}
            />
          </>
        )}

        {/* Display Options Panel */}
        {displayOptions.showDisplayOptions && (
          <>
            {/* Overlay */}
            <div
              className="absolute inset-0"
              onClick={displayOptions.toggleDisplayOptions}
            />
            <DisplayOptionsPanel
              colorFilter={displayOptions.colorFilter}
              customBgColor={displayOptions.customBgColor}
              setColorFilter={displayOptions.setColorFilter}
              setCustomBgColor={displayOptions.setCustomBgColor}
              fontSize={displayOptions.fontSize}
              increaseFontSize={displayOptions.increaseFontSize}
              decreaseFontSize={displayOptions.decreaseFontSize}
              lineHeight={displayOptions.lineHeight}
              increaseLineHeight={displayOptions.increaseLineHeight}
              decreaseLineHeight={displayOptions.decreaseLineHeight}
              pageLayout={displayOptions.pageLayout}
              togglePageLayout={displayOptions.togglePageLayout}
              fontFamily={displayOptions.fontFamily}
              toggleFontFamily={displayOptions.toggleFontFamily}
              rotation={displayOptions.rotation}
              rotatePage={displayOptions.rotatePage}
              resetRotation={displayOptions.resetRotation}
              onClose={displayOptions.toggleDisplayOptions}
            />
          </>
        )}

        {/* Mobile Options Panel */}
        <MobileOptionsPanel
          showMobileOptions={showMobileOptions}
          onClose={() => setShowMobileOptions(false)}
          displayOptions={displayOptions}
          tts={tts}
          enableTextSelection={enableTextSelection}
          setEnableTextSelection={setEnableTextSelection}
          readingMode={readingMode}
          setReadingMode={setReadingMode}
          decreaseRotation={decreaseRotation}
        />
      </div>

      {/* Modals and Forms - Outside reader area */}
      {bookmarks.showBookmarkForm && (
        <BookmarkForm
          pageNumber={bookmarks.editingBookmark?.pageNumber || navigation.pageInfo.current}
          initialNote={bookmarks.editingBookmark?.note || ''}
          onSubmit={handleBookmarkSubmit}
          onCancel={bookmarks.cancelBookmarkForm}
          isEditing={!!bookmarks.editingBookmark}
        />
      )}

      {/* Bottom Toolbar (Mobile) - Floating Glassmorphic */}
      {(!readingMode || toolbarVisible) && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigation.goToPrevPage}
                disabled={navigation.pageInfo.current <= 1}
                className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Page {navigation.pageInfo.current}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  of {navigation.pageInfo.total}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={navigation.goToNextPage}
                disabled={navigation.pageInfo.current >= navigation.pageInfo.total}
                className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Translation Popup */}
      {translationState.isOpen && (
        <TranslationPopup
          text={translationState.text}
          onDismiss={() => setTranslationState(prev => ({ ...prev, isOpen: false }))}
          position={translationState.position}
        />
      )}

      {/* Dictionary Popup */}
      {dictionaryState.isOpen && (
        <DictionaryPopup
          text={dictionaryState.text}
          onDismiss={() => setDictionaryState(prev => ({ ...prev, isOpen: false }))}
          position={dictionaryState.position}
        />
      )}

      {/* Pending Selection Popup */}
      {highlights.pendingSelection && (
        <ColorPickerPopup
          x={highlights.pendingSelection.x}
          y={highlights.pendingSelection.y}
          selectionHeight={highlights.pendingSelection.height}
          onColorSelect={(color) => {
            if (color.color === 'translate') {
              setTranslationState({
                isOpen: true,
                text: highlights.pendingSelection!.text,
                position: {
                  x: highlights.pendingSelection!.x,
                  y: highlights.pendingSelection!.y
                }
              });
              highlights.setPendingSelection(null);
            } else if (color.color === 'define') {
              setDictionaryState({
                isOpen: true,
                text: highlights.pendingSelection!.text,
                position: {
                  x: highlights.pendingSelection!.x,
                  y: highlights.pendingSelection!.y
                }
              });
              highlights.setPendingSelection(null);
            } else {
              highlights.createHighlight(color, navigation.pageInfo.current);
            }
          }}
          onDismiss={() => highlights.setPendingSelection(null)}
        />
      )}

      {/* Editing Highlight Popup */}
      {highlights.editingHighlight && (
        <ColorPickerPopup
          x={highlights.editingHighlight.x}
          y={highlights.editingHighlight.y}
          selectionHeight={highlights.editingHighlight.height}
          onColorSelect={(color) => {
            if (color.color === 'translate') {
               const highlight = highlights.highlights.find(h => h.id === highlights.editingHighlight!.id);
               if (highlight) {
                  setTranslationState({
                    isOpen: true,
                    text: highlight.text || '',
                    position: {
                      x: highlights.editingHighlight!.x,
                      y: highlights.editingHighlight!.y
                    }
                  });
               }
               highlights.setEditingHighlight(null);
            } else if (color.color === 'define') {
               const highlight = highlights.highlights.find(h => h.id === highlights.editingHighlight!.id);
               if (highlight) {
                  setDictionaryState({
                    isOpen: true,
                    text: highlight.text || '',
                    position: {
                      x: highlights.editingHighlight!.x,
                      y: highlights.editingHighlight!.y
                    }
                  });
               }
               highlights.setEditingHighlight(null);
            } else {
              highlights.updateHighlightColor(highlights.editingHighlight!.id, color);
            }
          }}
          onDismiss={() => highlights.setEditingHighlight(null)}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
