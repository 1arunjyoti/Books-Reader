'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ReactReader } from 'react-reader';
import type { Rendition, NavItem, Contents } from 'epubjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  BookOpen,
  X,
  Maximize,
  Minimize,
  Bookmark,
  BookmarkPlus,
  List,
  Palette,
  Type,
  Search,
  Columns2,
  RectangleVertical,
  ChevronDown,
  Volume2,
  Settings,
  Highlighter,
  Eye,
  EyeOff,
  RotateCw,
} from 'lucide-react';
import BookmarkForm from '../bookmark-form';
import ContentsAndBookmarksPanel from './ContentsAndBookmarksPanel';
import EpubHighlightsPanel from './EpubHighlightsPanel';
import ColorPickerPopup from './ColorPickerPopup';
import {
  Bookmark as BookmarkType,
  createBookmark,
  fetchBookmarks,
  updateBookmark,
  deleteBookmark,
} from '@/lib/api';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import {
  createHighlight as apiCreateHighlight,
  fetchHighlights,
  deleteHighlight as apiDeleteHighlight,
  updateHighlight as apiUpdateHighlight,
} from '@/lib/highlights-api';
import { sanitizeText } from '@/lib/sanitize-text';
import EpubSearchPanel from './EpubSearchPanel';
import { logger } from '@/lib/logger';
import EpubColorFilterPanel from './EpubColorFilterPanel';
import EpubTTSPanel from './EpubTTSPanel';
import DisplayOptionsPanel from './DisplayOptionsPanel';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { useValueAdjuster } from '@/hooks/useValueAdjuster';
import { useReadingMode } from '@/hooks/useReadingMode';

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
      display: 'none', // We'll use our custom header
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
  // SECURITY: Use centralized token management
  // Prevents redundant token fetches and improves security
  const { getAccessToken } = useAuthToken();

  const renditionRef = useRef<Rendition | undefined>(undefined);
  const [location, setLocation] = useState<string | number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState('EPUB Book');
  
  // Font size - initialize from localStorage
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-fontSize');
      return saved ? parseInt(saved, 10) : 100;
    }
    return 100;
  });
  
  const [isFullscreen, setIsFullscreen] = useState(false);

  // TOC and navigation
  const [toc, setToc] = useState<NavItem[]>([]);
  const [currentChapter, setCurrentChapter] = useState('');
  const [pageInfo, setPageInfo] = useState({ current: 0, total: 0 });
  const [isGeneratingLocations, setIsGeneratingLocations] = useState(false);
  const [locationGenerationProgress, setLocationGenerationProgress] = useState(0);
  const [pageInput, setPageInput] = useState('1');
  const [isMobileView, setIsMobileView] = useState(false);
  const [locationsReady, setLocationsReady] = useState(false); // Track when locations are generated
  const hasNavigatedToInitialPage = useRef(false); // Track if we've already navigated to initial page

  // Panel states
  const [showContentsAndBookmarks, setShowContentsAndBookmarks] = useState(false);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [showColorFilter, setShowColorFilter] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [showHighlightsPanel, setShowHighlightsPanel] = useState(false);

  // Color filter states
  const [colorFilter, setColorFilter] = useState<'none' | 'sepia' | 'dark' | 'custom'>('none');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');

  // Font family - initialize from localStorage
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans-serif'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-fontFamily');
      return (saved === 'serif' || saved === 'sans-serif') ? saved : 'serif';
    }
    return 'serif';
  });

  // Page layout
  const [pageLayout, setPageLayout] = useState<'single' | 'double'>('single');

  // Text selection toggle
  const [enableTextSelection, setEnableTextSelection] = useState(false);

  // Page rotation - initialize from localStorage
  const [rotation, setRotation] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`epub-rotation-${bookId}`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Line height for text - initialize from localStorage
  const [lineHeight, setLineHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('epub-lineHeight');
      return saved ? parseFloat(saved) : 1.5;
    }
    return 1.5;
  });

  // Text-to-Speech states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [showTTSControls, setShowTTSControls] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Toast notifications for user feedback
  const { toasts, closeToast, success, error } = useToast();

  // Reading mode: Auto-hide toolbar on desktop only
  const { readingMode, setReadingMode, toolbarVisible } = useReadingMode({
    bookId,
    enabled: !isMobileView, // Disable reading mode on mobile
  });

  // Session tracking states
  const [sessionStart, setSessionStart] = useState<Date>(new Date());
  const [sessionStartPage, setSessionStartPage] = useState<number>(currentPage || 1);
  const [isWindowActive, setIsWindowActive] = useState<boolean>(true);

  // Bookmark states
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);
  const [currentLocationCfi, setCurrentLocationCfi] = useState<string>('');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ cfi: string; excerpt: string }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const searchResultsRef = useRef<Array<{ cfi: string; excerpt: string }>>([]); // Track search results for cleanup

  // Highlight states
  const [highlights, setHighlights] = useState<Array<{ id: string; text: string; cfiRange: string; color: string; hex: string; note?: string; createdAt?: string; pageNumber?: number }>>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);
  const [pendingSelection, setPendingSelection] = useState<{ text: string; cfiRange: string; x: number; y: number; height: number } | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<{ id: string; cfiRange: string; x: number; y: number; height: number } | null>(null);
  const appliedHighlightsRef = useRef<Set<string>>(new Set()); // Track applied highlights by CFI
  const applyHighlightsRef = useRef<(() => void) | null>(null); // Store the applyHighlights function to avoid duplicate listeners
  
  // MEMORY LEAK FIX: Store stable listener references to ensure proper cleanup
  const renderListenerRef = useRef<(() => void) | null>(null);
  const relocateListenerRef = useRef<(() => void) | null>(null);
  const highlightsRef = useRef(highlights); // Keep current highlights accessible to listeners
  
  // PERFORMANCE FIX: Debounce font changes to prevent rapid highlight reapplication
  const fontChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const fontChangeRafRef = useRef<number | null>(null);
  
  // DUPLICATE PROCESS FIX: Debounce highlight application to prevent race conditions
  // When both 'rendered' and 'relocated' events fire simultaneously
  const highlightDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // REPEATED RENDERING FIX: Track previous page info to prevent unnecessary parent re-renders
  const pageInfoRef = useRef({ current: 0, total: 0 });
  const pageChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // REPEATED RENDERING FIX: Debounce resize handler to prevent hundreds of state updates
  const resizeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // RACE CONDITION FIX: Navigation lock to prevent concurrent navigation requests
  // Prevents issues when multiple sources (scroll, TTS, buttons, search) try to navigate simultaneously
  const navigationLockRef = useRef(false);
  const navigationQueueRef = useRef<Array<() => void>>([]);

  // Fetch highlights on mount
  useEffect(() => {
    const loadHighlightsAsync = async () => {
      try {
        setIsLoadingHighlights(true);
        // SECURITY: Use centralized token management
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token for highlights');
          error('Failed to load highlights. Please try refreshing the page.');
          return;
        }
        
        const fetchedHighlights = await fetchHighlights(bookId, accessToken);
        // Filter to only include EPUB highlights since this is an EPUB reader
        const epubHighlights = fetchedHighlights.filter(h => h.source === 'EPUB');
        
        // SECURITY: Sanitize all fetched highlights to prevent XSS from stored data
        // This provides defense-in-depth alongside React's built-in JSX escaping
        const sanitizedHighlights = epubHighlights.map(h => ({
          ...h,
          text: sanitizeText(h.text, { maxLength: 5000, allowNewlines: true }),
          note: h.note ? sanitizeText(h.note, { maxLength: 1000, allowNewlines: true }) : undefined,
        }));
        
        setHighlights(sanitizedHighlights);
      } catch (err) {
        logger.error('Error loading highlights:', err);
        error('Failed to load highlights. Some highlights may not be visible.');
      } finally {
        setIsLoadingHighlights(false);
      }
    };
    loadHighlightsAsync();
  }, [bookId, getAccessToken, error]);

  // Inject CSS for SVG highlight transparency (runs once on mount)
  // MEMORY LEAK FIX: Scope MutationObserver to EPUB container only
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
    
    // MEMORY LEAK FIX: Wait for EPUB container to be available
    // Instead of observing entire document.body, target specific container
    let observer: MutationObserver | null = null;
    let observerTarget: Element | null = null;
    
    // Function to find and observe the EPUB container
    const setupObserver = () => {
      // Try to find the ReactReader container
      // Look for common EPUB.js container classes/elements
      const epubContainer = document.querySelector('.epub-container') 
        || document.querySelector('[class*="epub"]')
        || document.querySelector('[class*="ReactReader"]')
        || document.querySelector('main'); // Fallback to main element
      
      if (!epubContainer || observerTarget === epubContainer) {
        return; // Already observing or container not ready
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
            if (node.nodeType === 1) { // Element node
              const element = node as Element;
              
              // MEMORY LEAK FIX: More specific check for highlight SVGs
              // Only process if it's actually a highlight-related SVG
              if (element.tagName === 'svg' && element.querySelector('g.hl')) {
                const hlGroups = element.querySelectorAll('g.hl');
                hlGroups.forEach((group) => {
                  group.removeAttribute('fill-opacity');
                });
              } else if (element.querySelector('svg g.hl')) {
                // Element contains highlight SVGs
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
      
      // MEMORY LEAK FIX: Observe only the EPUB container, not entire body
      observer.observe(epubContainer, {
        childList: true,
        subtree: true, // Still need subtree for nested elements
      });
      
      logger.log('MutationObserver scoped to:', epubContainer.className || epubContainer.tagName);
    };
    
    // Try to setup observer immediately
    setupObserver();
    
    // MEMORY LEAK FIX: Retry setup after a delay if container wasn't ready
    // This handles cases where ReactReader mounts after this effect
    const retryTimer = setTimeout(() => {
      if (!observerTarget) {
        setupObserver();
      }
    }, 500);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(retryTimer);
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      observerTarget = null;
      
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Track mobile view for responsive layout
  // REPEATED RENDERING FIX: Debounce resize handler to prevent excessive state updates
  useEffect(() => {
    const handleResize = () => {
      // Clear any existing debounce timer
      if (resizeDebounceRef.current) {
        clearTimeout(resizeDebounceRef.current);
      }
      
      // Schedule state update after 150ms of no resize events
      resizeDebounceRef.current = setTimeout(() => {
        setIsMobileView(window.innerWidth < 768);
        resizeDebounceRef.current = null;
      }, 150);
    };

    // Set initial value immediately (no debounce on mount)
    setIsMobileView(window.innerWidth < 768);

    // Add event listener
    window.addEventListener('resize', handleResize);

    return () => {
      // Clean up event listener
      window.removeEventListener('resize', handleResize);
      
      // Clear any pending debounce timer
      if (resizeDebounceRef.current) {
        clearTimeout(resizeDebounceRef.current);
        resizeDebounceRef.current = null;
      }
    };
  }, []);

  // DUPLICATE PROCESS FIX: Single reusable bookmark loading function
  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoadingBookmarks(true);
      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for bookmarks');
        error('Failed to load bookmarks. Please try refreshing the page.');
        return;
      }
      
      const fetchedBookmarks = await fetchBookmarks(bookId, accessToken);
      setBookmarks(fetchedBookmarks);
    } catch (err) {
      logger.error('Error loading bookmarks:', err);
      error('Failed to load bookmarks. Some bookmarks may not be visible.');
    } finally {
      setIsLoadingBookmarks(false);
    }
  }, [bookId, getAccessToken, error]);

  // Fetch bookmarks on mount
  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Persist line height to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-lineHeight', lineHeight.toString());
    }
  }, [lineHeight]);

  // Persist font size to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-fontSize', fontSize.toString());
    }
  }, [fontSize]);

  // Persist font family to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('epub-fontFamily', fontFamily);
    }
  }, [fontFamily]);

  // INITIAL PAGE NAVIGATION: Navigate to currentPage prop when book is ready
  useEffect(() => {
    // Only navigate if:
    // 1. We have a currentPage prop specified
    // 2. Locations are ready (for accurate navigation)
    // 3. We haven't already navigated to the initial page
    // 4. We have a rendition reference
    if (
      currentPage && 
      currentPage > 0 && 
      locationsReady && 
      !hasNavigatedToInitialPage.current && 
      renditionRef.current
    ) {
      logger.log('Navigating to initial page:', currentPage);
      goToPage(currentPage);
      hasNavigatedToInitialPage.current = true;
    }
  }, [currentPage, locationsReady]); // Re-run when locations become ready

  // Check if current location is bookmarked
  const currentPageBookmark = bookmarks.find((b) => b.pageNumber === pageInfo.current);
  const isCurrentPageBookmarked = !!currentPageBookmark;

  // Toggle bookmark for current page
  const toggleBookmark = async () => {
    if (isCurrentPageBookmarked && currentPageBookmark) {
      try {
        // SECURITY: Use centralized token management
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token for bookmark deletion');
          error('Unable to delete bookmark. Please try again.');
          return;
        }
        
        await deleteBookmark(currentPageBookmark.id, accessToken);
        await loadBookmarks();
        success('Bookmark removed');
      } catch (err) {
        logger.error('Error deleting bookmark:', err);
        error('Failed to delete bookmark. Please try again.');
      }
    } else {
      setShowBookmarkForm(true);
    }
  };

  // Handle bookmark form submit
  const handleBookmarkSubmit = async (note: string) => {
    try {
      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for bookmark submission');
        error('Unable to save bookmark. Please try again.');
        throw new Error('Failed to get access token');
      }

      if (editingBookmark) {
        await updateBookmark(editingBookmark.id, { note }, accessToken);
        success('Bookmark updated');
      } else {
        // Create bookmark with just the note (no CFI details)
        await createBookmark(
          {
            bookId,
            pageNumber: pageInfo.current,
            note: note || undefined,
          },
          accessToken
        );
        success('Bookmark created');
      }

      await loadBookmarks();
      setShowBookmarkForm(false);
      setEditingBookmark(null);
    } catch (err) {
      logger.error('Error saving bookmark:', err);
      error('Failed to save bookmark. Please try again.');
      throw err;
    }
  };

  // Handle edit bookmark
  const handleEditBookmark = (bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setShowBookmarkForm(true);
  };

  // Handle delete bookmark
  const handleDeleteBookmark = async (bookmarkId: string) => {
    try {
      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for bookmark deletion');
        error('Unable to delete bookmark. Please try again.');
        throw new Error('Failed to get access token');
      }
      
      await deleteBookmark(bookmarkId, accessToken);
      await loadBookmarks();
      success('Bookmark deleted');
    } catch (err) {
      logger.error('Error deleting bookmark:', err);
      error('Failed to delete bookmark. Please try again.');
      throw err;
    }
  };

  // Handle jump to bookmarked page
  const handleJumpToPage = (pageNumber: number) => {
    if (!renditionRef.current) return;
    // Navigate directly to the page number (page-based navigation)
    goToPage(pageNumber);
  };

  // Go to specific page
  const goToPage = (page: number) => {
    if (!renditionRef.current) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = renditionRef.current.book as any;
    
    // If locations are generated, use them to navigate
    if (book.locations && typeof book.locations.length === 'function' && book.locations.length() > 0) {
      const totalPages = book.locations.length();
      if (page >= 1 && page <= totalPages) {
        try {
          // Convert page number to location index (0-based)
          const locationIndex = page - 1;
          // Get the CFI for this location
          const cfi = book.locations.cfiFromLocation(locationIndex);
          if (cfi && cfi.length > 0) {
            try {
              setLocation(cfi);
            } catch (error) {
              logger.warn('Error setting location with CFI from locations:', error);
              // If CFI from locations fails, try direct page navigation
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              renditionRef.current?.display(page).catch((err: any) => {
                logger.warn('Error displaying page', { page, err });
              });
            }
            return;
          }
        } catch (error) {
          logger.warn('Error getting CFI from locations', error);
        }
      }
    }
    
    // Fallback: Try direct page navigation using spine
    try {
      if (renditionRef.current && typeof renditionRef.current.display === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renditionRef.current.display(page).catch((err: any) => {
          logger.warn('Error navigating to page', { page, err });
          // Last resort: Navigate to first valid spine item
          try {
            renditionRef.current?.display(0);
          } catch (e) {
            logger.error('Failed all navigation attempts:', e);
          }
        });
      }
    } catch (error) {
      logger.error('Error in goToPage fallback:', error);
    }
  };

  // RACE CONDITION FIX: Safe navigation wrapper that prevents concurrent navigation
  // Queues navigation requests if one is already in progress
  const safeNavigate = useCallback(async (navigationFn: () => void | Promise<void>) => {
    // If navigation is locked, queue this request
    if (navigationLockRef.current) {
      logger.log('Navigation locked, queueing request');
      navigationQueueRef.current.push(navigationFn);
      return;
    }

    try {
      // Lock navigation
      navigationLockRef.current = true;
      logger.log('Navigation locked');

      // Execute the navigation function
      await navigationFn();

      // Wait for EPUB.js to finish rendering (locationChanged event)
      // This prevents race conditions where rapid navigation requests
      // interfere with each other
      await new Promise(resolve => setTimeout(resolve, 100));

    } finally {
      // Unlock navigation
      navigationLockRef.current = false;
      logger.log('Navigation unlocked');

      // Process next queued navigation if any
      const nextNavigation = navigationQueueRef.current.shift();
      if (nextNavigation) {
        logger.log('Processing queued navigation');
        safeNavigate(nextNavigation);
      }
    }
  }, []);

  // Handle page input submit
  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    
    // Validate input
    if (isNaN(page)) {
      error('Please enter a valid page number');
      setPageInput(String(pageInfo.current));
      return;
    }
    
    if (page < 1) {
      error('Page number must be at least 1');
      setPageInput(String(pageInfo.current));
      return;
    }
    
    if (page > pageInfo.total) {
      error(`Page number cannot exceed ${pageInfo.total}`);
      setPageInput(String(pageInfo.current));
      return;
    }
    
    // Valid page number, navigate
    goToPage(page);
  };

  // Update page input when current page changes
  useEffect(() => {
    setPageInput(String(pageInfo.current));
  }, [pageInfo]);

  // Handle location change
  const locationChanged = useCallback(
    (epubcfi: string) => {
      setLocation(epubcfi);
      setCurrentLocationCfi(epubcfi);

      if (renditionRef.current) {
        const { displayed, href } = renditionRef.current.location.start;
        const chapter = toc.find((item) => item.href === href);

        if (chapter) {
          setCurrentChapter(chapter.label);
        }

        // Get absolute page number across the entire book
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const book = renditionRef.current.book as any;
        let absolutePage = displayed.page;
        let absoluteTotal = displayed.total;

        // PROGRESSIVE LOADING: If locations are generated, use them for accurate page numbers
        // Otherwise, fall back to chapter-relative page numbers (good enough for initial display)
        if (book.locations && book.locations.length() > 0) {
          try {
            const currentLocation = book.locations.locationFromCfi(epubcfi);
            absolutePage = typeof currentLocation === 'number' && currentLocation >= 0 
              ? currentLocation + 1 
              : displayed.page;
            absoluteTotal = book.locations.length();
          } catch (error) {
            logger.warn('Error getting location from CFI:', error);
            // Fallback to displayed values (chapter-relative)
          }
        }
        // ELSE: Locations not yet generated - use chapter-relative page numbers
        // This allows book to display immediately while locations generate in background

        // REPEATED RENDERING FIX: Only update if values actually changed
        // This prevents unnecessary re-renders of parent and sibling components
        const newPageInfo = {
          current: absolutePage,
          total: absoluteTotal,
        };

        // Check if page info has actually changed
        if (
          pageInfoRef.current.current !== newPageInfo.current ||
          pageInfoRef.current.total !== newPageInfo.total
        ) {
          // Update ref with new values
          pageInfoRef.current = newPageInfo;
          
          // Update state (triggers local re-render only if needed)
          setPageInfo(newPageInfo);

          // Debounce parent notification to reduce re-renders during rapid navigation
          if (onPageChange) {
            // Clear any existing debounce timer
            if (pageChangeDebounceRef.current) {
              clearTimeout(pageChangeDebounceRef.current);
            }
            
            // Schedule parent notification after 150ms of inactivity
            pageChangeDebounceRef.current = setTimeout(() => {
              onPageChange(newPageInfo.current, newPageInfo.total);
              pageChangeDebounceRef.current = null;
            }, 150);
          }
        }
      }
    },
    [toc, onPageChange]
  );

  // Apply color theme to rendition
  const applyColorTheme = useCallback((rendition: Rendition) => {
    if (colorFilter === 'none') {
      rendition.themes.override('background', '#ffffff');
      rendition.themes.override('color', '#000000');
    } else if (colorFilter === 'sepia') {
      rendition.themes.override('background', '#f4ecd8');
      rendition.themes.override('color', '#5b4636');
    } else if (colorFilter === 'dark') {
      rendition.themes.override('background', '#1a1a1a');
      rendition.themes.override('color', '#e0e0e0');
    } else if (colorFilter === 'custom') {
      rendition.themes.override('background', customBgColor);
    }
  }, [colorFilter, customBgColor]);

  // Handle text selection for highlighting
  const handleTextSelected = useCallback(
    (cfiRange: string, contents: Contents) => {
      if (!renditionRef.current) return;

      const text = contents.window.getSelection()?.toString();
      if (text) {
        // SECURITY: Sanitize text immediately upon selection to prevent XSS
        const sanitizedText = sanitizeText(text, {
          maxLength: 5000,
          allowNewlines: true,
          trimWhitespace: true,
        });
        
        // Get the selection coordinates
        const selection = contents.window.getSelection();
        const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
        
        if (range) {
          const rect = range.getBoundingClientRect();
          
          // Get the iframe's offset to convert from iframe-relative to viewport-relative coordinates
          const iframe = contents.document.defaultView?.frameElement as HTMLIFrameElement;
          const iframeRect = iframe?.getBoundingClientRect();
          
          // Calculate absolute position relative to viewport
          const x = (iframeRect?.left || 0) + rect.left + rect.width / 2;
          const y = (iframeRect?.top || 0) + rect.top;
          const height = rect.height;

          // Store pending selection with sanitized text
          setPendingSelection({ text: sanitizedText, cfiRange, x, y, height });
        }
      }
    },
    []
  );

  // Handle color selection from popup
  const handleColorSelect = async (color: { name: string; color: string; hex: string }) => {
    if (!pendingSelection || !renditionRef.current) return;

    const { text, cfiRange } = pendingSelection;
    // Note: text is already sanitized in handleTextSelected

    try {
      // Add highlight with selected color (opacity controlled via CSS)
      renditionRef.current.annotations.add(
        'highlight',
        cfiRange,
        {},
        undefined,
        'hl',
        { 
          fill: color.hex,
          'fill-opacity': '1', // Set to 1, let CSS opacity handle transparency
        }
      );

      // Track this highlight as already applied to prevent duplicate rendering
      // when the state update triggers the highlights effect
      appliedHighlightsRef.current.add(cfiRange);

      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlight creation');
        // Remove the highlight from display since we couldn't save it
        renditionRef.current?.annotations.remove(cfiRange, 'highlight');
        appliedHighlightsRef.current.delete(cfiRange);
        return;
      }
      
      // SECURITY: Text is already sanitized in handleTextSelected
      const savedHighlight = await apiCreateHighlight(
        bookId,
        {
          text, // Already sanitized
          cfiRange,
          color: color.color,
          hex: color.hex,
        },
        accessToken
      );

      // Store highlight for future reference with ID (include note and createdAt fields if present)
      // Calculate page number if locations are available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = renditionRef.current?.book as any;
      let pageNumber: number | undefined;
      
      if (book?.locations) {
        try {
          const pageLocation = book.locations.locationFromCfi(cfiRange);
          pageNumber = typeof pageLocation === 'number' && pageLocation >= 0 
            ? pageLocation + 1 
            : undefined;
        } catch (error) {
          logger.error('Error calculating page number:', error);
        }
      }

      setHighlights((prev) => [...prev, { 
        id: savedHighlight.id, 
        text, // Already sanitized in handleTextSelected
        cfiRange, 
        color: color.color, 
        hex: color.hex,
        note: savedHighlight.note ? sanitizeText(savedHighlight.note, { maxLength: 1000 }) : undefined,
        createdAt: savedHighlight.createdAt,
        pageNumber
      }]);
      
      // Clear pending selection
      setPendingSelection(null);
    } catch (err) {
      logger.error('Error saving highlight:', err);
      error('Failed to save highlight. Please try again.');
      // Remove the visual highlight if saving failed
      renditionRef.current?.annotations.remove(cfiRange, 'highlight');
      // Also remove from tracking if it was added
      appliedHighlightsRef.current.delete(cfiRange);
      setPendingSelection(null);
    }
  };

  // Remove highlight
  const handleRemoveHighlight = async (highlightId: string, cfiRange: string) => {
    if (!renditionRef.current) return;
    
    try {
      // Remove from EPUB.js annotations
      renditionRef.current.annotations.remove(cfiRange, 'highlight');
      
      // Remove from state
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
      
      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlight deletion');
        error('Unable to delete highlight. Please try again.');
        return;
      }
      
      await apiDeleteHighlight(highlightId, accessToken);
      success('Highlight removed');
    } catch (err) {
      logger.error('Error removing highlight:', err);
      error('Failed to remove highlight. Please try again.');
      // Optionally re-add the highlight if deletion failed
      // setHighlights((prev) => [...prev, highlight]);
      // renditionRef.current?.annotations.add(...)
    }
  };

  // Jump to highlight
  const handleJumpToHighlight = (cfiRange: string) => {
    if (!renditionRef.current) return;
    
    try {
      renditionRef.current.display(cfiRange);
      setShowHighlightsPanel(false);
    } catch (error) {
      logger.error('Error jumping to highlight:', error);
    }
  };

  // Direct color change from highlights panel (inline color picker)
  const handleDirectColorChange = async (highlightId: string, cfiRange: string, newHex: string) => {
    if (!renditionRef.current) return;

    // Find the color option that matches the hex
    const colorOption = [
      { name: 'Yellow', color: 'yellow', hex: '#ffff00' },
      { name: 'Green', color: 'green', hex: '#00ff00' },
      { name: 'Pink', color: 'pink', hex: '#ff69b4' },
      { name: 'Blue', color: 'blue', hex: '#87ceeb' },
      { name: 'Orange', color: 'orange', hex: '#ffa500' },
      { name: 'Purple', color: 'purple', hex: '#dda0dd' },
    ].find(c => c.hex === newHex);

    if (!colorOption) return;

    try {
      // Remove old annotation
      renditionRef.current.annotations.remove(cfiRange, 'highlight');
      appliedHighlightsRef.current.delete(cfiRange);

      // Add new annotation with updated color
      renditionRef.current.annotations.add(
        'highlight',
        cfiRange,
        {},
        undefined,
        'hl',
        {
          fill: colorOption.hex,
          'fill-opacity': '1',
        }
      );
      appliedHighlightsRef.current.add(cfiRange);

      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlight color update');
        error('Unable to change highlight color. Please try again.');
        return;
      }
      
      await apiUpdateHighlight(
        highlightId,
        {
          color: colorOption.color,
          hex: colorOption.hex,
        },
        accessToken
      );

      // Update state
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === highlightId ? { ...h, color: colorOption.color, hex: colorOption.hex } : h
        )
      );

      success('Highlight color updated');
    } catch (err) {
      logger.error('Error changing highlight color:', err);
      error('Failed to update highlight color. Please try again.');
      // Re-add original highlight if update failed
      const originalHighlight = highlights.find(h => h.id === highlightId);
      if (originalHighlight && renditionRef.current) {
        renditionRef.current.annotations.add(
          'highlight',
          cfiRange,
          {},
          undefined,
          'hl',
          {
            fill: originalHighlight.hex,
            'fill-opacity': '1',
          }
        );
        appliedHighlightsRef.current.add(cfiRange);
      }
    }
  };

  // Change highlight color
  const handleChangeHighlightColor = async (color: { name: string; color: string; hex: string }) => {
    if (!editingHighlight || !renditionRef.current) return;

    const { id, cfiRange } = editingHighlight;

    try {
      // Remove old annotation
      renditionRef.current.annotations.remove(cfiRange, 'highlight');
      appliedHighlightsRef.current.delete(cfiRange);

      // Add new annotation with updated color
      renditionRef.current.annotations.add(
        'highlight',
        cfiRange,
        {},
        undefined,
        'hl',
        {
          fill: color.hex,
          'fill-opacity': '1',
        }
      );
      appliedHighlightsRef.current.add(cfiRange);

      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlight color update');
        error('Unable to change highlight color. Please try again.');
        return;
      }
      
      await apiUpdateHighlight(
        id,
        {
          color: color.color,
          hex: color.hex,
        },
        accessToken
      );

      // Update state
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === id ? { ...h, color: color.color, hex: color.hex } : h
        )
      );

      // Clear editing state
      setEditingHighlight(null);
      success('Highlight color updated');
    } catch (err) {
      logger.error('Error changing highlight color:', err);
      error('Failed to update highlight color. Please try again.');
      // Re-add original highlight if update failed
      const originalHighlight = highlights.find(h => h.id === id);
      if (originalHighlight && renditionRef.current) {
        renditionRef.current.annotations.add(
          'highlight',
          cfiRange,
          {},
          undefined,
          'hl',
          {
            fill: originalHighlight.hex,
            'fill-opacity': '1',
          }
        );
        appliedHighlightsRef.current.add(cfiRange);
      }
      setEditingHighlight(null);
    }
  };

  // Save note to highlight
  // Save note to highlight
  const handleSaveNote = async (highlightId: string, note: string) => {
    try {
      // SECURITY: Sanitize note before saving to prevent XSS attacks
      const sanitizedNote = sanitizeText(note, {
        maxLength: 1000,
        allowNewlines: true,
        trimWhitespace: true,
      });
      
      // SECURITY: Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlight note update');
        error('Unable to save note. Please try again.');
        throw new Error('Failed to get access token');
      }
      
      await apiUpdateHighlight(
        highlightId,
        { note: sanitizedNote },
        accessToken
      );

      // Update state with sanitized note
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === highlightId ? { ...h, note: sanitizedNote } : h
        )
      );
      success('Note saved');
    } catch (err) {
      logger.error('Error saving note:', err);
      error('Failed to save note. Please try again.');
      throw err; // Re-throw to let the UI handle the error
    }
  };

  // PERFORMANCE FIX: Chunked location generation to prevent UI blocking
  // Generate locations in chunks to keep the UI responsive during processing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generateLocationsInChunks = async (book: any) => {
    try {
      setIsGeneratingLocations(true);
      setLocationGenerationProgress(0);

      const totalSpineItems = book.spine.length;
      
      logger.log(`Starting location generation for ${totalSpineItems} spine items...`);

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
            logger.log(`Generated ${totalLocations} locations for the book`);
            
            // Update highlights with page numbers now that locations are generated
            setHighlights((prevHighlights) =>
              prevHighlights.map((h) => {
                try {
                  const pageLocation = book.locations.locationFromCfi(h.cfiRange);
                  const pageNumber =
                    typeof pageLocation === 'number' && pageLocation >= 0
                      ? pageLocation + 1
                      : undefined;
                  return { ...h, pageNumber };
                } catch (error) {
                  logger.error('Error calculating page for highlight:', error);
                  return h;
                }
              })
            );
            
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
  };

  // Get rendition
  const getRendition = useCallback((rendition: Rendition) => {
    renditionRef.current = rendition;
    
    // PROGRESSIVE LOADING OPTIMIZATION: Show book immediately, defer location generation
    // This reduces perceived loading time by 300-500ms
    setIsLoading(false); // Book appears to user IMMEDIATELY

    // Apply font size
    rendition.themes.fontSize(`${fontSize}%`);

    // Apply font family and line height
    rendition.themes.default({
      body: {
        'font-family': fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif',
        'line-height': `${lineHeight}`,
      },
    });

    // DUPLICATE PROCESS FIX: Color theme is applied in separate useEffect
    // This prevents double application on mount and allows reactive updates
    // See lines 1320-1325 for the single application point

    // Text selection is controlled by enableTextSelection state
    // Event listener is added/removed in useEffect below

    // Get book metadata
    if (rendition.book.packaging.metadata.title) {
      setBookTitle(rendition.book.packaging.metadata.title);
    }

    // PROGRESSIVE LOADING OPTIMIZATION: Defer location generation
    // Generate locations in background after book is displayed
    // This allows user to start reading immediately while progress tracking loads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const book = rendition.book as any;
    if (book.locations && typeof book.locations.generate === 'function') {
      // Defer location generation by 500ms to prioritize initial render
      // User sees book content, then accurate page numbers appear
      setTimeout(() => {
        logger.log('📊 Starting deferred location generation...');
        generateLocationsInChunks(book);
      }, 500);
    }

    // SECURITY: Configure iframe sandbox with minimal required permissions
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
      // MEMORY LEAK FIX: Track listener for proper cleanup
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
            // RACE CONDITION FIX: Use safeNavigate wrapper
            safeNavigate(() => {
              rendition.next();
              logger.log('📖 Scroll next page');
            });
            lastScrollTime = now;
            scrollAccumulator = 0;
          } else {
            // Scrolling up = previous page
            // RACE CONDITION FIX: Use safeNavigate wrapper
            safeNavigate(() => {
              rendition.prev();
              logger.log('📖 Scroll previous page');
            });
            lastScrollTime = now;
            scrollAccumulator = 0;
          }
        }
      };

      // Attach wheel listener to iframe content
      if (contents.document) {
        contents.document.addEventListener('wheel', handleContentWheel, { passive: false });
        logger.log('✅ Scroll navigation attached to EPUB content');
      }

      // MEMORY LEAK FIX: Clean up scroll listener when content is unloaded
      // This happens when navigating to a new chapter/page
      contents.on('unloaded', () => {
        if (contents.document) {
          contents.document.removeEventListener('wheel', handleContentWheel);
          logger.log('🧹 Scroll navigation cleaned up from EPUB content');
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
  }, [fontSize, fontFamily, lineHeight, safeNavigate]);
  // DUPLICATE PROCESS FIX: Removed applyColorTheme from dependencies
  // Color theme is now only applied in the dedicated useEffect (lines 1320-1325)

  // Set up highlight rendering - separate effect to manage event listeners
  // MEMORY LEAK FIX: Use stable refs to prevent listener accumulation
  useEffect(() => {
    if (!renditionRef.current) return;

    const rendition = renditionRef.current;
    
    // Update the highlights ref so listeners always have current data
    highlightsRef.current = highlights;

    // Create the applyHighlights function
    const applyHighlights = () => {
      const currentHighlights = highlightsRef.current;
      
      if (currentHighlights.length === 0) {
        appliedHighlightsRef.current.clear();
        return;
      }

      // Get current CFIs to track what should be displayed
      const currentCfis = new Set(currentHighlights.map(h => h.cfiRange));
      
      // Remove highlights that are no longer in the list
      appliedHighlightsRef.current.forEach((cfi) => {
        if (!currentCfis.has(cfi)) {
          try {
            rendition.annotations.remove(cfi, 'highlight');
            appliedHighlightsRef.current.delete(cfi);
          } catch {
            // Ignore errors
          }
        }
      });

      // Apply only new highlights that haven't been added yet
      currentHighlights.forEach((highlight) => {
        if (!appliedHighlightsRef.current.has(highlight.cfiRange)) {
          try {
            rendition.annotations.add(
              'highlight',
              highlight.cfiRange,
              {},
              undefined,
              'hl',
              {
                fill: highlight.hex,
                'fill-opacity': '1', // Set to 1, let CSS opacity handle transparency
              }
            );
            appliedHighlightsRef.current.add(highlight.cfiRange);
          } catch (error) {
            logger.error(`Error applying highlight ${highlight.cfiRange}:`, error);
          }
        }
      });
    };

    // Store the function in ref for access from other effects
    applyHighlightsRef.current = applyHighlights;

    // MEMORY LEAK FIX: Only set up listeners once, not on every highlight change
    if (!renderListenerRef.current || !relocateListenerRef.current) {
      // DUPLICATE PROCESS FIX: Create debounced version to prevent race conditions
      // When both 'rendered' and 'relocated' events fire simultaneously (within 100ms),
      // only one highlight application occurs
      const applyHighlightsDebounced = () => {
        // Clear any pending application
        if (highlightDebounceRef.current) {
          clearTimeout(highlightDebounceRef.current);
        }
        
        // HIGHLIGHT RENDERING FIX: Proper highlight re-rendering after layout changes
        // Schedule application after delay to ensure layout is complete
        highlightDebounceRef.current = setTimeout(() => {
          if (applyHighlightsRef.current && renditionRef.current) {
            // CRITICAL FIX: Remove and reapply all highlights to force position recalculation
            // EPUB.js annotations cache positions, so we must clear them first
            appliedHighlightsRef.current.forEach((cfi) => {
              try {
                renditionRef.current?.annotations.remove(cfi, 'highlight');
              } catch {
                // Ignore errors during cleanup
              }
            });
            appliedHighlightsRef.current.clear();
            
            // Reapply highlights with fresh position calculations
            // Small delay ensures layout is completely stable
            setTimeout(() => {
              applyHighlightsRef.current?.();
            }, 50);
          }
          highlightDebounceRef.current = null;
        }, 100);
      };
      
      // Create stable listener functions that use debounced application
      const stableRenderListener = () => {
        applyHighlightsDebounced();
      };
      
      const stableRelocateListener = () => {
        applyHighlightsDebounced();
      };

      // Store in refs
      renderListenerRef.current = stableRenderListener;
      relocateListenerRef.current = stableRelocateListener;

      // Add listeners only once
      rendition.on('rendered', stableRenderListener);
      rendition.on('relocated', stableRelocateListener);
    }

    // Apply highlights immediately when they change
    const applyTimer = setTimeout(() => {
      applyHighlights();
    }, 100);

    // Cleanup only the timer, NOT the listeners (they persist)
    return () => {
      clearTimeout(applyTimer);
    };
  }, [highlights]);

  // MEMORY LEAK FIX: Clean up listeners only when component unmounts
  useEffect(() => {
    return () => {
      if (renditionRef.current && renderListenerRef.current && relocateListenerRef.current) {
        try {
          renditionRef.current.off('rendered', renderListenerRef.current);
          renditionRef.current.off('relocated', relocateListenerRef.current);
          renderListenerRef.current = null;
          relocateListenerRef.current = null;
        } catch {
          // Ignore cleanup errors if rendition is already destroyed
        }
      }
    };
  }, []); // Empty deps - runs only on unmount

  // PERFORMANCE FIX: Debounced font changes with single effect
  // Prevents rapid highlight reapplication when user changes multiple font settings
  useEffect(() => {
    if (!renditionRef.current) return;

    // Apply font changes immediately for instant visual feedback
    renditionRef.current.themes.fontSize(`${fontSize}%`);
    renditionRef.current.themes.default({
      body: {
        'font-family': fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif',
        'line-height': `${lineHeight}`,
      },
    });

    // Clear any existing debounce timers and RAF callbacks
    if (fontChangeDebounceRef.current) {
      clearTimeout(fontChangeDebounceRef.current);
    }
    if (fontChangeRafRef.current) {
      cancelAnimationFrame(fontChangeRafRef.current);
    }

    // Debounce highlight reapplication to wait for user to finish adjusting
    fontChangeDebounceRef.current = setTimeout(() => {
      // Use requestAnimationFrame for smooth, non-blocking updates
      fontChangeRafRef.current = requestAnimationFrame(() => {
        // Remove all current highlights
        appliedHighlightsRef.current.forEach((cfi) => {
          try {
            renditionRef.current?.annotations.remove(cfi, 'highlight');
          } catch {
            // Ignore errors during cleanup
          }
        });
        appliedHighlightsRef.current.clear();

        // Reapply highlights with new positioning
        // Small timeout ensures font changes are fully rendered
        setTimeout(() => {
          applyHighlightsRef.current?.();
        }, 50);
      });
    }, 300); // Wait 300ms after last change before reapplying highlights

    // Cleanup function
    return () => {
      if (fontChangeDebounceRef.current) {
        clearTimeout(fontChangeDebounceRef.current);
      }
      if (fontChangeRafRef.current) {
        cancelAnimationFrame(fontChangeRafRef.current);
      }
    };
  }, [fontSize, fontFamily, lineHeight]); // Single effect for all font changes

  // DUPLICATE PROCESS FIX: Single color theme application point
  // This effect runs:
  // 1. On mount (when applyColorTheme callback is created)
  // 2. When colorFilter changes (triggers applyColorTheme recreation)
  // 3. When customBgColor changes (triggers applyColorTheme recreation)
  // Previously, theme was also applied in getRendition callback, causing double application
  useEffect(() => {
    if (renditionRef.current) {
      applyColorTheme(renditionRef.current);
    }
  }, [colorFilter, customBgColor, applyColorTheme]);

  // Handle page layout change - preserve reading position
  useEffect(() => {
    if (currentLocationCfi) {
      // When layout changes and we have a saved position, restore it
      const timer = setTimeout(() => {
        setLocation(currentLocationCfi);
      }, 100); // Small delay to ensure rendition is ready
      return () => clearTimeout(timer);
    }
  }, [pageLayout, currentLocationCfi]);

  // Remove highlight - for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeHighlight = (cfiRange: string) => {
    if (renditionRef.current) {
      renditionRef.current.annotations.remove(cfiRange, 'highlight');
      // setSelections((prev) => prev.filter((s) => s.cfiRange !== cfiRange));
    }
  };

  // Navigate to highlight - for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigateToHighlight = (cfiRange: string) => {
    setLocation(cfiRange);
  };

  // PERFORMANCE FIX: Optimized search with chunking, cancellation, and progress tracking
  const handleSearch = async () => {
    if (!searchQuery || !renditionRef.current || isSearching) return;

    // Cancel any existing search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }

    searchAbortControllerRef.current = new AbortController();
    const { signal } = searchAbortControllerRef.current;

    setIsSearching(true);
    setSearchProgress(0);

    const results: Array<{ cfi: string; excerpt: string }> = [];
    const book = renditionRef.current.book;

    try {
      await book.ready;

      // Clear previous highlights
      searchResults.forEach((result) => {
        renditionRef.current?.annotations.remove(result.cfi, 'highlight');
      });

      // Get spine items as array for chunked processing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spine = book.spine as any;
      const spineArray: unknown[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spine.each((item: any) => spineArray.push(item));

      const total = spineArray.length;
      const chunkSize = 5; // Process 5 spine items at a time

      // Process spine items in chunks
      for (let i = 0; i < total; i += chunkSize) {
        // Check if search was cancelled
        if (signal.aborted) {
          logger.log('Search cancelled by user');
          break;
        }

        const chunk = spineArray.slice(i, Math.min(i + chunkSize, total));

        // Process chunk items in parallel
        await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chunk.map(async (item: any) => {
            if (signal.aborted) return;

            try {
              await item.load(book.load.bind(book));
              const doc = item.document;

              const textNodes: Node[] = [];
              const treeWalker = doc.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
              let node;
              while ((node = treeWalker.nextNode())) {
                textNodes.push(node);
              }

              const fullText = textNodes.map((n) => n.textContent).join('').toLowerCase();
              const query = searchQuery.toLowerCase();
              let pos = fullText.indexOf(query);

              while (pos !== -1) {
                let nodeIndex = 0;
                let foundOffset = pos;

                while (nodeIndex < textNodes.length) {
                  const nodeText = textNodes[nodeIndex].textContent || '';
                  if (foundOffset < nodeText.length) break;
                  foundOffset -= nodeText.length;
                  nodeIndex++;
                }

                if (nodeIndex < textNodes.length) {
                  const range = doc.createRange();
                  try {
                    range.setStart(textNodes[nodeIndex], foundOffset);
                    range.setEnd(textNodes[nodeIndex], foundOffset + searchQuery.length);
                    const cfi = item.cfiFromRange(range);
                    const excerpt = `${fullText.substring(
                      Math.max(0, pos - 20),
                      pos + searchQuery.length + 20
                    )}`;
                    results.push({ cfi, excerpt });
                  } catch (e) {
                    logger.warn('Skipping invalid range:', e);
                  }
                }

                pos = fullText.indexOf(query, pos + 1);
              }

              item.unload();
            } catch (error) {
              if (signal.aborted) return;
              logger.error('Error searching item:', error);
            }
          })
        );

        // Update progress
        const progress = Math.round(((i + chunkSize) / total) * 100);
        setSearchProgress(Math.min(progress, 100));

        // Yield to UI thread between chunks
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (!signal.aborted) {
        setSearchResults(results);
        searchResultsRef.current = results; // MEMORY LEAK FIX: Track for cleanup
        setCurrentSearchIndex(0);

        // Highlight results (limit to 100 for performance)
        const highlightLimit = Math.min(results.length, 100);
        for (let i = 0; i < highlightLimit; i++) {
          renditionRef.current?.annotations.add(
            'highlight',
            results[i].cfi,
            {},
            undefined,
            'search-highlight',
            { fill: 'yellow', 'fill-opacity': '0.5' }
          );
        }

        // Navigate to first result
        // RACE CONDITION FIX: Use safeNavigate for search result navigation
        if (results.length > 0) {
          safeNavigate(() => {
            setLocation(results[0].cfi);
          });
        }

        logger.log(`Search complete: ${results.length} results found`);
      }
    } catch (error) {
      // Don't log error if search was cancelled
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Search error:', error);
      }
    } finally {
      setIsSearching(false);
      setSearchProgress(0);
      searchAbortControllerRef.current = null;
    }
  };

  // Navigate search results
  // Navigate search results
  const goToNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    // RACE CONDITION FIX: Use safeNavigate for search navigation
    safeNavigate(() => {
      setLocation(searchResults[nextIndex].cfi);
    });
  };

  const goToPrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    // RACE CONDITION FIX: Use safeNavigate for search navigation
    safeNavigate(() => {
      setLocation(searchResults[prevIndex].cfi);
    });
  };

  // Cancel ongoing search
  const cancelSearch = () => {
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
      searchAbortControllerRef.current = null;
    }
    setIsSearching(false);
    setSearchProgress(0);
  };

  // Clear search
  const clearSearch = () => {
    // Cancel any ongoing search first
    cancelSearch();
    
    searchResults.forEach((result) => {
      renditionRef.current?.annotations.remove(result.cfi, 'highlight');
    });
    setSearchResults([]);
    searchResultsRef.current = []; // MEMORY LEAK FIX: Clear ref as well
    setSearchQuery('');
    setCurrentSearchIndex(0);
  };

  // REFACTORING: Use reusable value adjuster utility for font size and line height
  const { increase: increaseFontSize, decrease: decreaseFontSize } = useValueAdjuster(
    setFontSize,
    10,    // step
    50,    // min
    200    // max
  );

  const { increase: increaseLineHeight, decrease: decreaseLineHeight } = useValueAdjuster(
    setLineHeight,
    0.1,   // step
    1.0,   // min
    2.5    // max
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleFontFamily = () => {
    setFontFamily((prev) => (prev === 'serif' ? 'sans-serif' : 'serif'));
  };

  // REPEATED RENDERING FIX: Toggle page layout without re-mounting component
  const togglePageLayout = () => {
    const newLayout = pageLayout === 'single' ? 'double' : 'single';
    setPageLayout(newLayout);
    
    // Update rendition spread setting directly (no re-mount)
    if (renditionRef.current) {
      const spreadValue = newLayout === 'double' ? 'auto' : 'none';
      renditionRef.current.settings.spread = spreadValue;
      
      // Resize to apply the new spread setting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const container = (renditionRef.current as any).manager?.container;
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        renditionRef.current.resize(width, height);
      }
      
      logger.log(`Layout changed to ${newLayout} (spread: ${spreadValue})`);
    }
  };

  // Rotate page 90 degrees clockwise
  const rotatePage = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);

    // Apply rotation to rendition
    if (renditionRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iframe = (renditionRef.current as any).manager?.container?.querySelector('iframe');
      if (iframe && iframe.contentDocument) {
        const body = iframe.contentDocument.body;
        if (body) {
          body.style.transform = `rotate(${newRotation}deg)`;
          body.style.transformOrigin = 'center center';
          
          // Adjust container dimensions for 90/270 degree rotations
          if (newRotation === 90 || newRotation === 270) {
            const temp = iframe.style.width;
            iframe.style.width = iframe.style.height;
            iframe.style.height = temp;
          }
        }
      }
    }
  };

  // Reset rotation to 0 degrees
  const resetRotation = () => {
    setRotation(0);
  };

  // Persist rotation to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`epub-rotation-${bookId}`, String(rotation));
    }
  }, [rotation, bookId]);

  // Apply rotation to rendition when it changes
  useEffect(() => {
    if (!renditionRef.current) return;

    // Wait a bit for iframe to be ready
    const applyRotation = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iframe = (renditionRef.current as any)?.manager?.container?.querySelector('iframe');
      if (iframe?.contentDocument?.body) {
        const body = iframe.contentDocument.body;
        body.style.transform = rotation === 0 ? '' : `rotate(${rotation}deg)`;
        body.style.transformOrigin = 'center center';
        
        // For 90/270 degree rotations, we need to adjust the display
        if (rotation === 90 || rotation === 270) {
          body.style.width = '100vh';
          body.style.height = '100vw';
        } else {
          body.style.width = '';
          body.style.height = '';
        }
      }
    };

    // Apply immediately
    applyRotation();

    // Also try again after a delay in case iframe wasn't ready
    const timer = setTimeout(applyRotation, 100);
    return () => clearTimeout(timer);
  }, [rotation]);

  // Apply text selection setting to rendition
  useEffect(() => {
    if (!renditionRef.current) return;

    const rendition = renditionRef.current;

    if (enableTextSelection) {
      // Enable text selection for highlights
      rendition.on('selected', handleTextSelected);
    } else {
      // Disable text selection
      rendition.off('selected', handleTextSelected);
    }

    // Cleanup on unmount or when enableTextSelection changes
    return () => {
      rendition.off('selected', handleTextSelected);
    };
  }, [enableTextSelection, handleTextSelected]);

  // MEMORY LEAK FIX: Load available voices with proper cleanup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      let mounted = true;
      setVoicesLoading(true);

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!mounted) return; // Prevent state updates after unmount
        setAvailableVoices(voices);
        setVoicesLoading(false);
        if (voices.length > 0 && !selectedVoice) {
          // Set default voice (prefer English)
          const defaultVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          setSelectedVoice(defaultVoice);
        }
      };

      loadVoices();

      // Chrome loads voices asynchronously; register handler and cleanup on unmount
      const onVoicesChanged = () => loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = onVoicesChanged;
      }

      return () => {
        mounted = false;
        try {
          if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged === onVoicesChanged) {
            // Remove our handler
            window.speechSynthesis.onvoiceschanged = null as unknown as (() => void) | null;
          }
        } catch {
          // ignore
        }
      };
    }
    // MEMORY LEAK FIX: Empty deps array prevents re-registration on every selectedVoice change
    // The onVoicesChanged handler only needs to be set up once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // MEMORY LEAK FIX: Remove selectedVoice dependency to prevent re-registration

  // MEMORY LEAK FIX: Comprehensive SpeechSynthesis cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing speech
      if (speechSynthesisRef.current) {
        try {
          speechSynthesisRef.current.cancel();
          logger.log('SpeechSynthesis cancelled on unmount');
        } catch (error) {
          logger.error('Error cancelling speech:', error);
        }
      }
      
      // Clear utterance reference
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null;
      }
      
      // Clear speech synthesis reference
      speechSynthesisRef.current = null;
      
      // Note: State cleanup (setAvailableVoices, setSelectedVoice) is handled by React
      // No need to call setState in cleanup as component is unmounting
    };
  }, []); // Empty deps - cleanup only on unmount

  // ==================== Reading Session Tracking ====================
  
  // Memoize logReadingSession to prevent recreating on every render
  const logReadingSession = useCallback(async () => {
    if (!sessionStart || !isWindowActive) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - sessionStart.getTime()) / 1000); // in seconds

    // Only log if session is at least 10 seconds
    if (duration < 10) return;

    const currentPageNum = pageInfo.current || 1;
    const pagesRead = Math.abs(currentPageNum - sessionStartPage);
    const progressDelta = Math.abs(currentPageNum - sessionStartPage);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for reading session');
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

      // Reset session
      setSessionStart(new Date());
      setSessionStartPage(currentPageNum);
    } catch (error) {
      logger.error('Error logging reading session:', error);
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
      logReadingSession();
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

  // MEMORY LEAK FIX: Comprehensive Rendition cleanup on unmount
  useEffect(() => {
    // Capture current refs and state for cleanup
    const currentRendition = renditionRef.current;
    const currentAppliedHighlights = appliedHighlightsRef.current;
    const currentApplyHighlights = applyHighlightsRef.current;
    const currentRenderListener = renderListenerRef.current;
    const currentRelocateListener = relocateListenerRef.current;
    const currentHighlightDebounce = highlightDebounceRef.current;
    const currentPageChangeDebounce = pageChangeDebounceRef.current;
    const currentSearchAbortController = searchAbortControllerRef.current;
    const currentSearchResults = searchResultsRef.current; // Use ref for cleanup
    
    return () => {
      // DUPLICATE PROCESS FIX: Clear pending highlight application debounce timer
      if (currentHighlightDebounce) {
        clearTimeout(currentHighlightDebounce);
        highlightDebounceRef.current = null;
      }
      
      // REPEATED RENDERING FIX: Clear pending page change notification debounce timer
      if (currentPageChangeDebounce) {
        clearTimeout(currentPageChangeDebounce);
        pageChangeDebounceRef.current = null;
      }
      
      // MEMORY LEAK FIX: Cancel any ongoing search
      if (currentSearchAbortController) {
        currentSearchAbortController.abort();
        searchAbortControllerRef.current = null;
      }
      
      // Clean up EPUB.js Rendition instance
      if (currentRendition) {
        try {
          // MEMORY LEAK FIX: Remove search highlights before destroying rendition
          // This prevents search highlights from persisting in memory
          currentSearchResults.forEach((result) => {
            try {
              currentRendition.annotations.remove(result.cfi, 'highlight');
            } catch {
              // Ignore errors if annotation doesn't exist
            }
          });
          logger.log(`🧹 Cleaned up ${currentSearchResults.length} search highlights on unmount`);
          
          // Remove event listeners to prevent memory leaks
          // Note: handleTextSelected cleanup is handled separately by its own effect
          
          // Destroy rendition to clean up:
          // - Canvas/SVG elements
          // - Event listeners on iframe
          // - Internal EPUB.js resources
          // - Manager and view instances
          if (typeof currentRendition.destroy === 'function') {
            currentRendition.destroy();
            logger.log('Rendition destroyed on unmount');
          }
          
          // Clear the reference
          renditionRef.current = undefined;
        } catch (error) {
          logger.error('Error destroying rendition:', error);
        }
      }
      
      // Clear applied highlights tracking
      if (currentAppliedHighlights) {
        currentAppliedHighlights.clear();
      }
      
      // Clear other refs (captured values, safe to use)
      if (currentApplyHighlights) {
        applyHighlightsRef.current = null;
      }
      if (currentRenderListener) {
        renderListenerRef.current = null;
      }
      if (currentRelocateListener) {
        relocateListenerRef.current = null;
      }
    };
  }, []); // Empty deps - cleanup only on unmount

  // Text-to-Speech functions
  const startTextToSpeech = useCallback(() => {
    if (!renditionRef.current) return;

    // Get the current page text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manager = (renditionRef.current as any).manager;
    const iframe = manager?.container?.querySelector('iframe') as HTMLIFrameElement;
    
    if (!iframe?.contentDocument) {
      logger.error('Cannot access iframe content for TTS');
      return;
    }

    const bodyText = iframe.contentDocument.body.innerText || iframe.contentDocument.body.textContent || '';
    
    if (!bodyText.trim()) {
      logger.error('No text found to read');
      return;
    }

  if (!speechSynthesisRef.current) return;

  // Clear previous TTS errors
  setTtsError(null);

  // Stop any ongoing speech
  speechSynthesisRef.current.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(bodyText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = speechVolume;
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // TTS CONTINUOUS READING FIX: Check if we can go to next page
      // Get current page info to check if there are more pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const book = renditionRef.current?.book as any;
      let canContinue = false;
      
      if (book?.locations && renditionRef.current) {
        try {
          const currentLocation = renditionRef.current.location;
          const currentCfi = currentLocation?.start?.cfi;
          
          if (currentCfi) {
            const currentPage = book.locations.locationFromCfi(currentCfi);
            const totalPages = book.locations.length();
            
            // Check if there's a next page
            canContinue = currentPage < totalPages - 1;
          }
        } catch (error) {
          logger.warn('Error checking page continuation:', error);
        }
      }
      
      if (canContinue && renditionRef.current) {
        // Move to next page and continue reading
        logger.log('📖 TTS: Moving to next page and continuing...');
        
        // RACE CONDITION FIX: Use safeNavigate for TTS auto-pagination
        safeNavigate(async () => {
          if (renditionRef.current) {
            renditionRef.current.next();
            
            // Wait for the page to render before continuing TTS
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (speechSynthesisRef.current) {
              startTextToSpeech();
            }
          }
        });
      } else {
        // Reached end of book or can't continue
        logger.log('📖 TTS: Reached end of book');
        setIsSpeaking(false);
        setIsPaused(false);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    utterance.onerror = () => {
      // Silently handle errors without showing to user
      setIsSpeaking(false);
      setIsPaused(false);
      setTtsError(null);
    };

    currentUtteranceRef.current = utterance;
    try {
      speechSynthesisRef.current.speak(utterance);
    } catch (e) {
      logger.error('Error calling speechSynthesis.speak:', e);
      setTtsError(String((e as Error).message || e));
    }
  }, [speechRate, speechPitch, speechVolume, selectedVoice, safeNavigate]);

  const stopTextToSpeech = useCallback(() => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const pauseTextToSpeech = useCallback(() => {
    if (speechSynthesisRef.current && isSpeaking && !isPaused) {
      speechSynthesisRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking, isPaused]);

  const resumeTextToSpeech = useCallback(() => {
    if (speechSynthesisRef.current && isSpeaking && isPaused) {
      speechSynthesisRef.current.resume();
      setIsPaused(false);
    }
  }, [isSpeaking, isPaused]);

  const toggleTextToSpeech = useCallback(() => {
    if (isSpeaking) {
      if (isPaused) {
        resumeTextToSpeech();
      } else {
        pauseTextToSpeech();
      }
    } else {
      startTextToSpeech();
    }
  }, [isSpeaking, isPaused, startTextToSpeech, pauseTextToSpeech, resumeTextToSpeech]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
    };
  }, []);

  const handleTOCItemClick = (href: string) => {
    setLocation(href);
    setShowContentsAndBookmarks(false);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const readerStyles = getReaderStyles(colorFilter, customBgColor);

  return (
    <div 
      className="fixed inset-0 flex flex-col z-50"
      style={{ backgroundColor: readerStyles.readerArea.backgroundColor }}
    >
      {/* Header Toolbar - Auto-hides in reading mode */}
      {(!readingMode || toolbarVisible) && (
      <div className={`border-b px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 ${
        colorFilter === 'dark' 
          ? 'bg-gray-900 border-gray-800 text-white' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between gap-2">
          {/* Left Section - Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${
              colorFilter === 'dark' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'
            }`} />
            <h1 className={`text-sm sm:text-lg font-semibold truncate ${
              colorFilter === 'dark' ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              {bookTitle}
            </h1>
          </div>

          {/* Center Section - Page Info (Desktop Only) */}
          <div className="hidden md:flex items-center gap-2">
            {currentChapter && (
              <span className={`text-sm max-w-xs truncate ${
                colorFilter === 'dark' ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {currentChapter}
              </span>
            )}

            <Button
              variant="ghost"
              size="icon"
              disabled={pageInfo.current <= 1 || isLoading}
              onClick={() => {
                // RACE CONDITION FIX: Use safeNavigate for button clicks
                safeNavigate(() => {
                  renditionRef.current?.prev();
                });
              }}
              title="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Page Input */}
            <div className="flex items-center gap-2">
              <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                <Input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  min={1}
                  max={pageInfo.total}
                  className="w-16 text-center h-8 text-sm"
                  disabled={pageInfo.total === 0 || isLoading}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  / {pageInfo.total}
                </span>
              </form>
              {isGeneratingLocations && (
                <div className="flex flex-col gap-1 ml-2 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Calculating pages...
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {locationGenerationProgress}%
                    </span>
                  </div>
                  <Progress 
                    value={locationGenerationProgress} 
                    className="h-1 w-full"
                  />
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // RACE CONDITION FIX: Use safeNavigate for button clicks
                safeNavigate(() => {
                  renditionRef.current?.next();
                });
              }}
              disabled={pageInfo.current >= pageInfo.total || isLoading}
              title="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Section - Essential Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Search - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchPanel(!showSearchPanel)}
              title="Search"
              className={`h-8 w-8 sm:h-10 sm:w-10 ${showSearchPanel ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Bookmark Controls - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              disabled={isLoadingBookmarks || isLoading}
              title={isCurrentPageBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              className={`h-8 w-8 sm:h-10 sm:w-10 ${isCurrentPageBookmarked ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              {isCurrentPageBookmarked ? (
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              ) : (
                <BookmarkPlus className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            {/* Bookmark Panel */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowContentsAndBookmarks(!showContentsAndBookmarks)}
              disabled={isLoadingBookmarks}
              title="Contents & Bookmarks"
              className={`h-8 w-8 sm:h-10 sm:w-10 ${showContentsAndBookmarks ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <List className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Highlights Panel - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
              disabled={highlights.length === 0}
              title="Highlights"
              className={`h-8 w-8 sm:h-10 sm:w-10 sm:hidden relative ${showHighlightsPanel ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
            >
              <Highlighter className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Desktop Advanced Features */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

              {/* Highlights Panel */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHighlightsPanel(!showHighlightsPanel)}
                disabled={highlights.length === 0}
                title="Highlights"
                className={`relative ${showHighlightsPanel ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Highlighter className="h-5 w-5" />
              </Button>

              {/* Display Options Panel Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDisplayOptions(!showDisplayOptions)}
                title="Display options"
                className={showDisplayOptions ? 'bg-gray-100 dark:bg-gray-700' : ''}
              >
                <Settings className="h-5 w-5" />
              </Button>

              {/* Text-to-Speech Panel */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTTSControls(!showTTSControls)}
                title="Text-to-Speech"
                className={showTTSControls ? "bg-gray-100 dark:bg-gray-700" : ""}
              >
                <Volume2 className="h-5 w-5" />
              </Button>

              {/* Text Selection Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEnableTextSelection(!enableTextSelection)}
                title={enableTextSelection ? "Disable text selection" : "Enable text selection"}
                className={enableTextSelection ? "bg-gray-100 dark:bg-gray-700" : ""}
              >
                <Type className="h-5 w-5" />
              </Button>

            </div>

            {/* Mobile More Options Menu */}
            <div className="flex lg:hidden items-center gap-1">
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              
              {/* More Options Dropdown - Mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="More options"
                    className="h-8 w-8"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                  {/* Table of Contents & Bookmarks */}
                  {/* <DropdownMenuItem onClick={() => setShowContentsAndBookmarks(!showContentsAndBookmarks)}>
                    <BookMarked className="h-4 w-4 mr-2" />
                    <span>{showContentsAndBookmarks ? 'Hide' : 'Show'} Contents & Bookmarks</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator /> */}
                  
                  {/* Font Size Controls */}
                  <DropdownMenuItem onClick={decreaseFontSize}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    <span>Decrease Font ({fontSize}%)</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={increaseFontSize}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    <span>Increase Font ({fontSize}%)</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Font Family */}
                  <DropdownMenuItem onClick={toggleFontFamily}>
                    <Type className="h-4 w-4 mr-2" />
                    <span>Font: {fontFamily === 'serif' ? 'Serif' : 'Sans-serif'}</span>
                  </DropdownMenuItem>
                  
                  {/* Line Height */}
                  <DropdownMenuItem onClick={decreaseLineHeight}>
                    <ZoomOut className="h-4 w-4 mr-2" />
                    <span>Decrease Line Height</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={increaseLineHeight}>
                    <ZoomIn className="h-4 w-4 mr-2" />
                    <span>Increase Line Height</span>
                  </DropdownMenuItem>
                  
                  {/* Page Layout */}
                  <DropdownMenuItem onClick={togglePageLayout}>
                    {pageLayout === 'single' ? (
                      <RectangleVertical className="h-4 w-4 mr-2" />
                    ) : (
                      <Columns2 className="h-4 w-4 mr-2" />
                    )}
                    <span>Layout: {pageLayout === 'single' ? 'Single' : 'Double'}</span>
                  </DropdownMenuItem>
                  
                  {/* Page Rotation */}
                  <DropdownMenuItem onClick={rotatePage}>
                    <RotateCw className="h-4 w-4 mr-2" />
                    <span>Rotate Page ({rotation}°)</span>
                  </DropdownMenuItem>
                  
                  {/* Color Filters */}
                  <DropdownMenuItem onClick={() => setShowColorFilter(!showColorFilter)}>
                    <Palette className="h-4 w-4 mr-2" />
                    <span>{showColorFilter ? 'Hide Color Filters' : 'Color Filters'}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />

                  {/* Text-to-Speech Panel */}
                  <DropdownMenuItem onClick={() => setShowTTSControls(!showTTSControls)}>
                    <Volume2 className="h-4 w-4 mr-2" />
                    <span>Text-to-Speech</span>
                  </DropdownMenuItem>
                  
                  {/* Text Selection Toggle */}
                  <DropdownMenuItem onClick={() => setEnableTextSelection(!enableTextSelection)}>
                    <Type className="h-4 w-4 mr-2" />
                    <span>{enableTextSelection ? 'Disable Text Selection' : 'Enable Text Selection'}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Fullscreen */}
                  <DropdownMenuItem onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                    <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Fullscreen - Tablet and up */}
            <div className="hidden sm:flex items-center gap-1">
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
              
              {/* Reading Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReadingMode(!readingMode)}
                title={readingMode ? "Exit reading mode (R)" : "Enter reading mode (R)"}
                className={readingMode ? "bg-blue-100 dark:bg-blue-900/50" : ""}
              >
                {readingMode ? (
                  <EyeOff className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </Button>
              
              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Close Reader - Always visible */}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                title="Close"
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Progress Bar */}
      <div className="h-1 bg-blue-200 dark:bg-blue-900/30 flex-shrink-0">
        <Progress 
          value={pageInfo.total > 0 ? (pageInfo.current / pageInfo.total) * 100 : 0}
          className="h-full rounded-none [&>*]:bg-gray-600 dark:[&>*]:bg-gray-500"
        />
      </div>

      {/* Reader Area */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        <div 
          style={{ 
            height: '100%',
            width: isMobileView ? '100%' : (pageLayout === 'single' ? '50%' : '100%'),
            transition: 'width 0.3s ease-in-out',
          }}
        >
          <ReactReader
            url={fileUrl}
            location={location}
            locationChanged={locationChanged}
            tocChanged={setToc}
            getRendition={getRendition}
            showToc={false} // We use custom TOC
            readerStyles={readerStyles}
            epubOptions={{
              flow: 'paginated',
              manager: 'default',
              snap: true,
              spread: pageLayout === 'double' ? 'auto' : 'none',
              allowScriptedContent: false, // SECURITY: Disabled to prevent XSS from malicious EPUB files
            }}
          />
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 dark:bg-gray-900/90 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading book...</p>
            </div>
          </div>
        )}

        {/* Contents and Bookmarks Combined Panel */}
        {showContentsAndBookmarks && (
          <>
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/20 dark:bg-black/40 z-10"
              onClick={() => setShowContentsAndBookmarks(false)}
            />
            {/* Panel */}
            <ContentsAndBookmarksPanel
              toc={toc}
              onTocItemClick={handleTOCItemClick}
              bookmarks={bookmarks}
              isLoadingBookmarks={isLoadingBookmarks}
              currentPage={pageInfo.current}
              onJumpToPage={handleJumpToPage}
              onEditBookmark={handleEditBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              onClose={() => setShowContentsAndBookmarks(false)}
            />
          </>
        )}

        {/* Search Panel (extracted) */}
        {showSearchPanel && (
          <EpubSearchPanel
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearch={handleSearch}
            searchResults={searchResults}
            currentSearchIndex={currentSearchIndex}
            onPrev={goToPrevSearchResult}
            onNext={goToNextSearchResult}
            onSelectResult={(index) => {
              setCurrentSearchIndex(index);
              setLocation(searchResults[index].cfi);
            }}
            onClear={clearSearch}
            onClose={() => setShowSearchPanel(false)}
            isSearching={isSearching}
            searchProgress={searchProgress}
            onCancelSearch={cancelSearch}
          />
        )}

        {/* Color Filter Controls (extracted) */}
        {showColorFilter && (
          <EpubColorFilterPanel
            colorFilter={colorFilter}
            customBgColor={customBgColor}
            setColorFilter={setColorFilter}
            setCustomBgColor={setCustomBgColor}
            onClose={() => setShowColorFilter(false)}
          />
        )}

        {/* TTS Control Panel (extracted) */}
        {/* Text-to-Speech Panel */}
        {showTTSControls && (
          <EpubTTSPanel
            availableVoices={availableVoices}
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speechRate={speechRate}
            setSpeechRate={setSpeechRate}
            speechPitch={speechPitch}
            setSpeechPitch={setSpeechPitch}
            speechVolume={speechVolume}
            setSpeechVolume={setSpeechVolume}
            isSpeaking={isSpeaking}
            isPaused={isPaused}
            toggleTextToSpeech={toggleTextToSpeech}
            stopTextToSpeech={stopTextToSpeech}
            onClose={() => setShowTTSControls(false)}
            ttsError={ttsError}
            voicesLoading={voicesLoading}
          />
        )}

        {/* Display Options Panel (extracted) */}
        {showDisplayOptions && (
          <>
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black/20 dark:bg-black/40 z-10"
              onClick={() => setShowDisplayOptions(false)}
            />
            {/* Panel */}
            <DisplayOptionsPanel
              colorFilter={colorFilter}
              customBgColor={customBgColor}
              setColorFilter={setColorFilter}
              setCustomBgColor={setCustomBgColor}
              fontSize={fontSize}
              increaseFontSize={increaseFontSize}
              decreaseFontSize={decreaseFontSize}
              lineHeight={lineHeight}
              increaseLineHeight={increaseLineHeight}
              decreaseLineHeight={decreaseLineHeight}
              pageLayout={pageLayout}
              togglePageLayout={togglePageLayout}
              fontFamily={fontFamily}
              toggleFontFamily={toggleFontFamily}
              rotation={rotation}
              rotatePage={rotatePage}
              resetRotation={resetRotation}
              onClose={() => setShowDisplayOptions(false)}
            />
          </>
        )}

        {/* Highlights Panel */}
        {showHighlightsPanel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/20 z-10"
              onClick={() => setShowHighlightsPanel(false)}
            />
            <EpubHighlightsPanel
              highlights={highlights}
              isLoading={isLoadingHighlights}
              onRemoveHighlight={handleRemoveHighlight}
              onJumpToHighlight={handleJumpToHighlight}
              onChangeColor={handleDirectColorChange}
              onSaveNote={handleSaveNote}
              onClose={() => setShowHighlightsPanel(false)}
            />
          </>
        )}

        {/* Color Picker Popup for new highlights */}
        {pendingSelection && (
          <ColorPickerPopup
            x={pendingSelection.x}
            y={pendingSelection.y}
            selectionHeight={pendingSelection.height}
            onColorSelect={handleColorSelect}
            onDismiss={() => setPendingSelection(null)}
          />
        )}

        {/* Color Picker Popup for editing highlights */}
        {editingHighlight && (
          <ColorPickerPopup
            x={editingHighlight.x}
            y={editingHighlight.y}
            selectionHeight={editingHighlight.height}
            onColorSelect={handleChangeHighlightColor}
            onDismiss={() => setEditingHighlight(null)}
          />
        )}
      </div>

      {/* Bookmark Form Modal */}
      {showBookmarkForm && (
        <BookmarkForm
          pageNumber={editingBookmark?.pageNumber || pageInfo.current}
          initialNote={editingBookmark?.note || ''}
          onSubmit={handleBookmarkSubmit}
          onCancel={() => {
            setShowBookmarkForm(false);
            setEditingBookmark(null);
          }}
          isEditing={!!editingBookmark}
        />
      )}

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0 flex flex-col items-center">
        {/* Current Chapter (Mobile) */}
        {currentChapter && (
          <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {currentChapter}
          </span>
        )}

        {/* Page change buttons */}
        <div className="flex items-center justify-between w-full mt-1">          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // RACE CONDITION FIX: Use safeNavigate for button clicks
              safeNavigate(() => {
                renditionRef.current?.prev();
              });
            }}
            disabled={pageInfo.current <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-gray-600 dark:text-gray-300">
            {pageInfo.current} / {pageInfo.total}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // RACE CONDITION FIX: Use safeNavigate for button clicks
              safeNavigate(() => {
                renditionRef.current?.next();
              });
            }}
            disabled={pageInfo.current >= pageInfo.total || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
    </div>
  );
}
