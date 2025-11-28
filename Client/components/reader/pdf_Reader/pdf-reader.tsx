"use client";

import { useEffect, useCallback, useReducer, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useReadingMode } from '@/hooks/useReadingMode';
import { safeLocalStorageSetItem, safeLocalStorageGetItem } from '@/lib/safe-local-storage';
import PDFReaderErrorBoundary from './PDFReaderErrorBoundary';
import {
  viewerReducer,
  uiReducer,
  dataReducer,
  sessionReducer,
} from './pdfReaderReducers';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize,
  BookOpen,
  X,
  Bookmark,
  BookmarkPlus,
  List,
  Search,
  Layers,
  Volume2,
  Type,
  Settings,
  Highlighter,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScaledPosition } from 'react-pdf-highlighter';
import BookmarkForm from '../bookmark-form';
import ThumbnailSidebar from '../thumbnail-sidebar';
import PDFContentsAndBookmarksPanel from './PDFContentsAndBookmarksPanel';
import PDFDisplayOptionsPanel from './PDFDisplayOptionsPanel';
import PDFTTSPanel from './PDFTTSPanel';
import PDFSearchPanel from './pdf-search-panel';
import { MemoizedPDFScrollViewer } from './pdf-scroll-viewer';
import type { PDFScrollViewerHandle } from './pdf-scroll-viewer';
import { 
  Bookmark as BookmarkType,
  createBookmark,
  fetchBookmarks,
  updateBookmark,
  deleteBookmark
} from '@/lib/api';
import {
  fetchHighlights as fetchHighlightsApi,
  deleteHighlight as deleteHighlightApi,
  updateHighlight as updateHighlightApi,
  createHighlight as createHighlightApi,
} from '@/lib/highlights-api';
import PDFHighlightsPanel from './PDFHighlightsPanel';
import PDFMobileOptionsPanel from './PDFMobileOptionsPanel';
import type { PdfHighlight, PdfHighlightRect } from '@/types/highlights';
import TranslationPopup from '../TranslationPopup';
import DictionaryPopup from '../DictionaryPopup';

interface RawPdfHighlight extends Omit<PdfHighlight, 'rects' | 'boundingRect'> {
  rects?: unknown;
  boundingRect?: unknown;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const normalizeRect = (rect: unknown, fallbackPage: number): PdfHighlightRect | null => {
  if (!rect || typeof rect !== 'object') {
    return null;
  }

  const candidate = rect as Record<string, unknown>;
  
  // The library provides Scaled coordinates with x1, y1, x2, y2 in absolute pixels
  // and width, height as page dimensions
  const pageWidth = typeof candidate.width === 'number' ? candidate.width : 1;
  const pageHeight = typeof candidate.height === 'number' ? candidate.height : 1;
  
  // Get coordinates - prefer x1/y1 from Scaled format, fall back to x/y from stored format
  const x1 = typeof candidate.x1 === 'number' ? candidate.x1 : typeof candidate.x === 'number' ? candidate.x : 0;
  const y1 = typeof candidate.y1 === 'number' ? candidate.y1 : typeof candidate.y === 'number' ? candidate.y : 0;
  
  // Calculate width and height
  let rectWidth: number;
  let rectHeight: number;
  
  if (typeof candidate.x2 === 'number' && typeof candidate.y2 === 'number') {
    // Scaled format: calculate from x1, y1, x2, y2
    rectWidth = (candidate.x2 as number) - x1;
    rectHeight = (candidate.y2 as number) - y1;
  } else if (typeof candidate.width === 'number' && typeof candidate.height === 'number' && 
             candidate.width <= 1 && candidate.height <= 1) {
    // Already normalized format (from stored highlights)
    rectWidth = candidate.width;
    rectHeight = candidate.height;
  } else {
    rectWidth = 0;
    rectHeight = 0;
  }
  
  const pageNumber = typeof candidate.pageNumber === 'number' ? candidate.pageNumber : fallbackPage;
  
  // Normalize to 0-1 range by dividing by page dimensions
  // If values are already in 0-1 range, they'll stay the same
  const normalizedX = x1 > 1 ? x1 / pageWidth : x1;
  const normalizedY = y1 > 1 ? y1 / pageHeight : y1;
  const normalizedWidth = rectWidth > 1 ? rectWidth / pageWidth : rectWidth;
  const normalizedHeight = rectHeight > 1 ? rectHeight / pageHeight : rectHeight;

  return {
    x: clamp01(normalizedX),
    y: clamp01(normalizedY),
    width: clamp01(normalizedWidth),
    height: clamp01(normalizedHeight),
    pageNumber,
  };
};

const computeBoundingRect = (rects: PdfHighlightRect[], fallbackPage: number): PdfHighlightRect => {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, pageNumber: fallbackPage };
  }

  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => clamp01(rect.x + rect.width)));
  const maxY = Math.max(...rects.map((rect) => clamp01(rect.y + rect.height)));

  return {
    x: clamp01(minX),
    y: clamp01(minY),
    width: clamp01(maxX - minX),
    height: clamp01(maxY - minY),
    pageNumber: rects[0].pageNumber ?? fallbackPage,
  };
};

const normalizePdfHighlight = (rawHighlight: RawPdfHighlight): PdfHighlight | null => {
  if (!rawHighlight || rawHighlight.source !== 'PDF') {
    return null;
  }

  const rectsSource = Array.isArray(rawHighlight.rects) ? rawHighlight.rects : [];
  const fallbackPage = typeof rawHighlight.pageNumber === 'number' ? rawHighlight.pageNumber : 1;
  const rects = rectsSource
    .map((rect) => normalizeRect(rect, fallbackPage))
    .filter((rect): rect is PdfHighlightRect => rect !== null);

  if (rects.length === 0) {
    return null;
  }

  const boundingRectCandidate = normalizeRect(rawHighlight.boundingRect, fallbackPage);
  const boundingRect = boundingRectCandidate ?? computeBoundingRect(rects, fallbackPage);

  return {
    ...rawHighlight,
    pageNumber: fallbackPage,
    rects,
    boundingRect,
  };
};

interface CreatePdfHighlightArgs {
  position: ScaledPosition;
  text: string;
  color: string;
  hex: string;
}

// Namespaced window interface to prevent global pollution
const DEFAULT_SCALE = 1.5;
const DEFAULT_SCALE_MOBILE = 1.2; // Lower default scale for mobile devices
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const DEFAULT_ROTATION = 0;
const SCALE_STORAGE_PREFIX = 'pdfReaderScale:';
const ROTATION_STORAGE_PREFIX = 'pdfReaderRotation:';

const clampScaleValue = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

const normalizeRotationValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_ROTATION;
  }

  const positive = ((value % 360) + 360) % 360;
  const steps = Math.round(positive / 90) % 4;
  return (steps * 90) % 360;
};

const parseStoredNumber = (raw: string | null) => {
  if (!raw) {
    return null;
  }

  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const getScaleStorageKey = (bookId: string) => `${SCALE_STORAGE_PREFIX}${bookId}`;
const getRotationStorageKey = (bookId: string) => `${ROTATION_STORAGE_PREFIX}${bookId}`;

const readPersistedNumber = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return parseStoredNumber(safeLocalStorageGetItem(storageKey));
  } catch (error) {
    logger.error(`Failed to read persisted PDF setting: ${storageKey}`, error);
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface PDFReaderProps {
  url: string;
  bookId: string;
  title?: string;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onClose?: () => void;
}

export function PDFReader({
  url,
  bookId,
  title = 'Document',
  initialPage = 1,
  onPageChange,
  onClose
}: PDFReaderProps) {
  // Centralized auth token context for all API calls
  const { getAccessToken } = useAuthToken();
  
  // Mobile detection for performance optimizations
  const isMobile = useMobileDetection();

  // Reading mode: Auto-hide toolbar on all devices
  const { readingMode, setReadingMode, toolbarVisible } = useReadingMode({
    bookId,
    enabled: true, // Enable on all devices including mobile
  });
  
  // Viewer state: page navigation, zoom, rotation, PDF document
  const [viewerState, dispatchViewer] = useReducer(viewerReducer, {
    currentPage: initialPage,
    numPages: 0,
    pageInput: String(initialPage),
    scale: (() => {
      const stored = readPersistedNumber(getScaleStorageKey(bookId));
      const baseScale = stored ?? (isMobile ? DEFAULT_SCALE_MOBILE : DEFAULT_SCALE);
      return clampScaleValue(baseScale);
    })(),
    rotation: (() => {
      const stored = readPersistedNumber(getRotationStorageKey(bookId));
      return normalizeRotationValue(stored ?? DEFAULT_ROTATION);
    })(),
    pdfDoc: null,
  });

  // UI state: panels, fullscreen, text selection, color filters
  const [uiState, dispatchUI] = useReducer(uiReducer, {
    isFullscreen: false,
    enableTextSelection: false,
    colorFilter: 'none',
    customBgColor: '#ffffff',
    panels: {
      contentsAndBookmarks: false,
      bookmarkForm: false,
      thumbnails: false,
      search: false,
      tts: false,
      displayOptions: false,
      highlights: false,
      mobileOptions: false,
    },
  });

  // Data state: bookmarks, highlights, loading states
  const [dataState, dispatchData] = useReducer(dataReducer, {
    bookmarks: [],
    highlights: [],
    isLoadingBookmarks: true,
    isLoadingHighlights: true,
    editingBookmark: null,
  });

  // Session state: reading session tracking
  const [sessionState, dispatchSession] = useReducer(sessionReducer, {
    sessionStart: new Date(),
    sessionStartPage: initialPage,
    isWindowActive: true,
  });

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

  // Destructure for easier access
  const { currentPage, numPages, pageInput, scale, rotation, pdfDoc } = viewerState;
  const { isFullscreen, enableTextSelection, colorFilter, customBgColor, panels } = uiState;
  const { bookmarks, highlights, isLoadingBookmarks, isLoadingHighlights, editingBookmark } = dataState;
  const { sessionStart, sessionStartPage, isWindowActive } = sessionState;

  // Panel visibility helpers (for backward compatibility)
  const showContentsAndBookmarksPanel = panels.contentsAndBookmarks;
  const showBookmarkForm = panels.bookmarkForm;
  const showThumbnails = panels.thumbnails;
  const showSearch = panels.search;
  const showTTS = panels.tts;
  const showDisplayOptions = panels.displayOptions;
  const showHighlightsPanel = panels.highlights;
  const showMobileOptions = panels.mobileOptions;

  useEffect(() => {
    if (typeof window === 'undefined') {
      dispatchViewer({ type: 'SET_SCALE', payload: DEFAULT_SCALE });
      dispatchViewer({ type: 'SET_ROTATION', payload: DEFAULT_ROTATION });
      return;
    }

    const storedScale = readPersistedNumber(getScaleStorageKey(bookId));
    const nextScale = clampScaleValue(storedScale ?? DEFAULT_SCALE);
    if (scale !== nextScale) {
      dispatchViewer({ type: 'SET_SCALE', payload: nextScale });
    }

    const storedRotation = readPersistedNumber(getRotationStorageKey(bookId));
    const nextRotation = normalizeRotationValue(storedRotation ?? DEFAULT_ROTATION);
    if (rotation !== nextRotation) {
      dispatchViewer({ type: 'SET_ROTATION', payload: nextRotation });
    }
    // Only run when bookId changes to load persisted settings for new book
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Fetch bookmarks on mount - DEFERRED for performance
  // Load bookmarks AFTER PDF is displayed to avoid blocking initial render
  // This improves perceived performance
  useEffect(() => {
    const loadBookmarksAsync = async () => {
      try {
        dispatchData({ type: 'SET_LOADING_BOOKMARKS', payload: true });
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token');
          return;
        }
        const fetchedBookmarks = await fetchBookmarks(bookId, accessToken);
        dispatchData({ type: 'SET_BOOKMARKS', payload: fetchedBookmarks });
      } catch (error) {
        logger.error('Error loading bookmarks:', error);
      } finally {
        dispatchData({ type: 'SET_LOADING_BOOKMARKS', payload: false });
      }
    };
    
    // Defer bookmark loading by 100ms to ensure PDF renders first
    // This prevents bookmarks from blocking the initial PDF display
    const timer = setTimeout(() => {
      loadBookmarksAsync();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [bookId, getAccessToken]);

  // Reload bookmarks
  const loadBookmarks = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        return;
      }
      const fetchedBookmarks = await fetchBookmarks(bookId, accessToken);
      dispatchData({ type: 'SET_BOOKMARKS', payload: fetchedBookmarks });
    } catch (error) {
      logger.error('Error loading bookmarks:', error);
    }
  }, [bookId, getAccessToken]);

  const loadPdfHighlights = useCallback(async (forceReload = false) => {
    // Prevent duplicate loads
    if (!forceReload && isLoadingHighlightsRef.current) {
      logger.log('Highlights already loading, skipping duplicate request');
      return;
    }
    
    // Skip if already loaded for this book (unless force reload)
    if (!forceReload && highlightsLoadedRef.current === bookId) {
      logger.log('Highlights already loaded for this book');
      return;
    }

    isLoadingHighlightsRef.current = true;
    
    try {
      dispatchData({ type: 'SET_LOADING_HIGHLIGHTS', payload: true });
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        return;
      }

      const fetchedHighlights = await fetchHighlightsApi(bookId, accessToken);
      const pdfHighlights = fetchedHighlights
        .map((highlight) => normalizePdfHighlight(highlight as RawPdfHighlight))
        .filter((highlight): highlight is PdfHighlight => Boolean(highlight));
      dispatchData({ type: 'SET_HIGHLIGHTS', payload: pdfHighlights });
      
      // Mark as loaded for this book
      highlightsLoadedRef.current = bookId;
    } catch (error) {
      logger.error('Error loading highlights:', error);
      // On error, reset so user can retry
      highlightsLoadedRef.current = null;
    } finally {
      dispatchData({ type: 'SET_LOADING_HIGHLIGHTS', payload: false });
      isLoadingHighlightsRef.current = false;
    }
  }, [bookId, getAccessToken]);

  const handleCreateHighlight = useCallback(async ({ position, text, color, hex }: CreatePdfHighlightArgs) => {
    const fallbackPage = typeof position?.pageNumber === 'number' ? position.pageNumber : currentPage;
    
    logger.log('[PDF Create Highlight] Raw position data:', {
      position,
      fallbackPage,
      rects: position?.rects,
      boundingRect: position?.boundingRect
    });
    
    // Create unique operation key based on position and text
    const opKey = `highlight-create-${fallbackPage}-${text.substring(0, 20)}`;
    
    // Prevent duplicate highlight creation
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Highlight creation already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const rectSource = Array.isArray(position?.rects) ? position.rects : [];

      const rects = rectSource
        .map((rect) => normalizeRect(rect, fallbackPage))
        .filter((rect): rect is PdfHighlightRect => rect !== null);

      logger.log('[PDF Create Highlight] Normalized rects:', {
        original: rectSource,
        normalized: rects
      });

      const boundingRectCandidate = position?.boundingRect
        ? normalizeRect(position.boundingRect, fallbackPage)
        : null;
      const boundingRect = boundingRectCandidate ?? (rects.length > 0 ? computeBoundingRect(rects, fallbackPage) : null);

      if (rects.length === 0 || !boundingRect) {
        logger.warn('Skipping highlight creation due to invalid position data');
        return;
      }

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token for highlight creation');
          return;
        }

        const createdHighlight = await createHighlightApi(
          bookId,
          {
            text,
            color,
            hex,
            pageNumber: fallbackPage,
            rects,
            boundingRect,
            source: 'PDF',
          },
          accessToken,
        );

        const normalizedHighlight = normalizePdfHighlight(createdHighlight as RawPdfHighlight);

        if (normalizedHighlight) {
          dispatchData({ type: 'ADD_HIGHLIGHT', payload: normalizedHighlight });
        } else {
          // Force reload if normalization failed
          await loadPdfHighlights(true);
        }
      } catch (error) {
        logger.error('Error creating highlight:', error);
      }
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  }, [bookId, currentPage, getAccessToken, loadPdfHighlights]);

  // Force reload highlights 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const reloadHighlights = useCallback(() => {
    highlightsLoadedRef.current = null;
    loadPdfHighlights(true);
  }, [loadPdfHighlights]);

  // Check if current page is bookmarked
  const currentPageBookmark = bookmarks.find(b => b.pageNumber === currentPage);
  const isCurrentPageBookmarked = !!currentPageBookmark;

  // Toggle bookmark for current page
  const toggleBookmark = useCallback(async () => {
    const opKey = `bookmark-toggle-${currentPage}`;
    
    // Prevent concurrent operations on the same page
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Bookmark operation already in progress for page', currentPage);
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      if (isCurrentPageBookmarked && currentPageBookmark) {
        // Delete existing bookmark
        try {
          const accessToken = await getAccessToken();
          if (!accessToken) {
            logger.error('Failed to get access token');
            return;
          }
          await deleteBookmark(currentPageBookmark.id, accessToken);
          await loadBookmarks();
        } catch (error) {
          logger.error('Error deleting bookmark:', error);
        }
      } else {
        // Show form to create new bookmark
        dispatchUI({ type: 'TOGGLE_PANEL', payload: 'bookmarkForm' });
      }
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  }, [isCurrentPageBookmarked, currentPageBookmark, currentPage, getAccessToken, loadBookmarks]);

  // Handle bookmark form submit
  const handleBookmarkSubmit = useCallback(async (note: string) => {
    const opKey = editingBookmark 
      ? `bookmark-update-${editingBookmark.id}`
      : `bookmark-create-${currentPage}`;
    
    // Prevent concurrent operations
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Bookmark save operation already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        throw new Error('Unable to obtain access token');
      }
      
      if (editingBookmark) {
        // Update existing bookmark
        await updateBookmark(editingBookmark.id, { note }, accessToken);
      } else {
        // Create new bookmark
        await createBookmark({
          bookId,
          pageNumber: currentPage,
          note: note || undefined
        }, accessToken);
      }
      
      await loadBookmarks();
      dispatchUI({ type: 'SET_PANEL', payload: { panel: 'bookmarkForm', open: false } });
      dispatchData({ type: 'SET_EDITING_BOOKMARK', payload: null });
    } catch (error) {
      logger.error('Error saving bookmark:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  }, [editingBookmark, currentPage, getAccessToken, bookId, loadBookmarks]);

  // Handle edit bookmark - Simple state update, no memoization needed
  const handleEditBookmark = (bookmark: BookmarkType) => {
    dispatchData({ type: 'SET_EDITING_BOOKMARK', payload: bookmark });
    dispatchUI({ type: 'SET_PANEL', payload: { panel: 'bookmarkForm', open: true } });
  };

  // Handle delete bookmark - Not passed to memoized children, no memoization needed
  const handleDeleteBookmark = async (bookmarkId: string) => {
    const opKey = `bookmark-delete-${bookmarkId}`;
    
    // Prevent concurrent delete operations
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Bookmark delete operation already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        throw new Error('Unable to obtain access token');
      }
      await deleteBookmark(bookmarkId, accessToken);
      await loadBookmarks();
    } catch (error) {
      logger.error('Error deleting bookmark:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  };

  // Handle delete highlight - Simple API call, no memoization needed
  const handleDeleteHighlight = async (highlightId: string) => {
    const opKey = `highlight-delete-${highlightId}`;
    
    // Prevent concurrent delete operations
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Highlight delete operation already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        return;
      }

      await deleteHighlightApi(highlightId, accessToken);
      dispatchData({ type: 'DELETE_HIGHLIGHT', payload: highlightId });
    } catch (error) {
      logger.error('Error deleting highlight:', error);
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  };

  // Handle highlight color change - Simple API call, no memoization needed
  const handleHighlightColorChange = async (highlightId: string, color: string, hex: string) => {
    const opKey = `highlight-color-${highlightId}`;
    
    // Prevent concurrent color changes on the same highlight
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Highlight color change already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        return;
      }

      await updateHighlightApi(highlightId, { color, hex }, accessToken);
      dispatchData({ 
        type: 'UPDATE_HIGHLIGHT', 
        payload: { id: highlightId, data: { color, hex } } 
      });
    } catch (error) {
      logger.error('Error updating highlight color:', error);
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  };

  // Handle highlight note save
  const handleHighlightNoteSave = async (highlightId: string, note: string) => {
    const opKey = `highlight-note-${highlightId}`;
    
    // Prevent concurrent note updates on the same highlight
    if (pendingOperationsRef.current.has(opKey)) {
      logger.log('Highlight note save already in progress');
      return;
    }
    
    pendingOperationsRef.current.add(opKey);
    
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token');
        return;
      }

      await updateHighlightApi(highlightId, { note }, accessToken);
      dispatchData({ 
        type: 'UPDATE_HIGHLIGHT', 
        payload: { id: highlightId, data: { note } } 
      });
    } catch (error) {
      logger.error('Error saving highlight note:', error);
    } finally {
      pendingOperationsRef.current.delete(opKey);
    }
  };

  useEffect(() => {
    dispatchViewer({ type: 'SET_PAGE_INPUT', payload: String(currentPage) });
  }, [currentPage]);

  // Track highlights loading state to prevent duplicate loads
  const highlightsLoadedRef = useRef<string | null>(null); // Store bookId to detect changes
  const isLoadingHighlightsRef = useRef(false); // Prevent concurrent loads
  
  // Track pending operations to prevent race conditions and duplicate API calls
  const pendingOperationsRef = useRef<Set<string>>(new Set());
  const pdfViewerRef = useRef<PDFScrollViewerHandle | null>(null);
  
  useEffect(() => {
    // Only load if we haven't loaded for this book yet
    if (highlightsLoadedRef.current !== bookId && !isLoadingHighlightsRef.current) {
      loadPdfHighlights();
    }
  }, [bookId, loadPdfHighlights]);

  /* Handle page change */
  const handlePageChange = useCallback((page: number, total: number) => {
    dispatchViewer({ type: 'SET_CURRENT_PAGE', payload: page });
    dispatchViewer({ type: 'SET_NUM_PAGES', payload: total });
    
    if (onPageChange) {
      onPageChange(page, total);
    }
  }, [onPageChange]);

  /* Handle load success */
  const handleLoadSuccess = useCallback((total: number) => {
    dispatchViewer({ type: 'SET_NUM_PAGES', payload: total });
  }, []);

  /* Handle PDF document loaded */
  const handlePdfDocumentLoaded = useCallback((numPages: number, doc: PDFDocumentProxy) => {
    handleLoadSuccess(numPages);
    dispatchViewer({ type: 'SET_PDF_DOC', payload: doc });
  }, [handleLoadSuccess]);

  /* Go to specific page */
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= numPages) {
      dispatchViewer({ type: 'SET_CURRENT_PAGE', payload: page });
      pdfViewerRef.current?.scrollToPage(page);
    }
  }, [numPages]);

  // Handle jump to bookmarked page
  const handleJumpToPage = useCallback((pageNumber: number) => {
    goToPage(pageNumber);
  }, [goToPage]);

  const handleJumpToHighlight = useCallback((highlight: PdfHighlight) => {
    if (!highlight) return;
    goToPage(highlight.pageNumber);
    pdfViewerRef.current?.scrollToHighlight(highlight);
  }, [goToPage]);

  // Handle page input submit
  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      dispatchViewer({ type: 'SET_PAGE_INPUT', payload: String(currentPage) });
    }
  };

  // Simple navigation functions
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  const zoomIn = () => {
    dispatchViewer({ type: 'ADJUST_SCALE', payload: 0.25 });
  };
  const zoomOut = () => {
    dispatchViewer({ type: 'ADJUST_SCALE', payload: -0.25 });
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const result = safeLocalStorageSetItem(
      getScaleStorageKey(bookId),
      String(scale)
    );

    if (!result.success) {
      logger.error('Failed to persist PDF zoom level:', result.error);
      // Could notify user here if needed
      // e.g., toast.error('Unable to save zoom level - storage full');
    }
  }, [bookId, scale]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const result = safeLocalStorageSetItem(
      getRotationStorageKey(bookId),
      String(rotation)
    );

    if (!result.success) {
      logger.error('Failed to persist PDF rotation:', result.error);
      // Could notify user here if needed
    }
  }, [bookId, rotation]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      dispatchUI({ type: 'SET_FULLSCREEN', payload: true });
    } else {
      document.exitFullscreen();
      dispatchUI({ type: 'SET_FULLSCREEN', payload: false });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      dispatchUI({ type: 'SET_FULLSCREEN', payload: !!document.fullscreenElement });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ==================== Reading Session Tracking ====================
  
  // Memoize logReadingSession to prevent recreating on every render
  const logReadingSession = useCallback(async () => {
    if (!sessionStart || !isWindowActive) return;

    const now = new Date();
    const duration = Math.floor((now.getTime() - sessionStart.getTime()) / 1000); // in seconds

    // Only log if session is at least 10 seconds
    if (duration < 10) return;

    const pagesRead = Math.abs(currentPage - sessionStartPage);
    const progressDelta = Math.abs(currentPage - sessionStartPage);

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
        endPage: currentPage,
        progressDelta
      }, accessToken);

      // Reset session
      dispatchSession({ type: 'START_SESSION', payload: { page: currentPage } });
    } catch (error) {
      logger.warn('Unable to log reading session (analytics unavailable):', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [sessionStart, isWindowActive, currentPage, sessionStartPage, bookId, getAccessToken]);
  
  // Initialize session only once on mount
  useEffect(() => {
    dispatchSession({ type: 'START_SESSION', payload: { page: currentPage } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  
  // Track window visibility and focus
  useEffect(() => {
    // Flag to prevent state updates after unmount
    let isMounted = true;

    // Track window visibility
    const handleVisibilityChange = () => {
      if (!isMounted) return;
      
      if (document.hidden) {
        dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: false });
        // Don't await async operation in event handler
        void logReadingSession();
      } else {
        dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: true });
        // Start new session when user returns
        dispatchSession({ type: 'START_SESSION', payload: { page: currentPage } });
      }
    };

    // Track window blur/focus
    const handleBlur = () => {
      if (!isMounted) return;
      dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: false });
      void logReadingSession();
    };

    const handleFocus = () => {
      if (!isMounted) return;
      dispatchSession({ type: 'SET_WINDOW_ACTIVE', payload: true });
      dispatchSession({ type: 'START_SESSION', payload: { page: currentPage } });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      isMounted = false;
      
      // Log final session asynchronously but don't block cleanup
      void logReadingSession();
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [logReadingSession, currentPage]);

  // Periodically log active sessions (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isWindowActive) {
        void logReadingSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isWindowActive, logReadingSession]);

  // Calculate reading progress
  const progress = numPages > 0 ? Math.round((currentPage / numPages) * 100) : 0;

  return (
    <PDFReaderErrorBoundary
      fallbackTitle="PDF Reader Error"
      onReset={() => {
        // Reset to initial state on error recovery
        dispatchViewer({ type: 'SET_CURRENT_PAGE', payload: 1 });
        dispatchUI({ type: 'CLOSE_ALL_PANELS' });
      }}
    >
      <div className="fixed inset-0 flex flex-col bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm z-50">
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
                    {title}
                  </h1>
                </div>

                {/* Center Section - Navigation (Desktop Only) */}
                <div className="hidden md:flex items-center gap-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevPage}
                    disabled={currentPage <= 1}
                    title="Previous page"
                    className="h-8 w-8 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Input */}
                  <div className="flex items-center gap-2 px-2">
                    <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
                      <Input
                        type="text"
                        value={pageInput}
                        onChange={(e) => dispatchViewer({ type: 'SET_PAGE_INPUT', payload: e.target.value })}
                        className="w-12 text-center h-7 text-sm border-none bg-transparent focus-visible:ring-0 p-0"
                        disabled={numPages === 0}
                      />
                      <span className="text-sm text-gray-400 dark:text-gray-500 select-none">
                        / {numPages}
                      </span>
                    </form>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextPage}
                    disabled={currentPage >= numPages}
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
                    onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'search' })}
                    title="Search in PDF"
                    className={`h-9 w-9 rounded-lg transition-all ${showSearch ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  {/* Bookmark Controls - Always visible */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleBookmark}
                    disabled={isLoadingBookmarks || numPages === 0}
                    title={isCurrentPageBookmarked ? "Remove bookmark" : "Add bookmark"}
                    className={`h-9 w-9 rounded-lg transition-all ${isCurrentPageBookmarked ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    {isCurrentPageBookmarked ? (
                      <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                    ) : (
                      <BookmarkPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>

                  {/* Bookmark Panel - Always visible */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'contentsAndBookmarks' })}
                    disabled={isLoadingBookmarks}
                    title="Contents and bookmarks"
                    className={`h-9 w-9 rounded-lg transition-all ${showContentsAndBookmarksPanel ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <List className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  {/* Highlights Panel - Always visible */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'highlights' })}
                    title="Highlights"
                    className={`h-9 w-9 rounded-lg transition-all ${showHighlightsPanel ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  >
                    <Highlighter className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>

                  {/* Desktop Advanced Features */}
                  <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700 ml-1">
                    
                    {/* Page Thumbnails */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'thumbnails' })}
                      title="Page thumbnails"
                      className={`h-9 w-9 rounded-lg transition-all ${showThumbnails ? "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                      <Layers className="h-5 w-5" />
                    </Button>
                    
                    {/* Display Options / Reading Themes */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'displayOptions' })}
                      title="Display options"
                      className={`h-9 w-9 rounded-lg transition-all ${showDisplayOptions ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>

                    {/* Text-to-Speech */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'tts' })}
                      title="Read aloud"
                      className={`h-9 w-9 rounded-lg transition-all ${showTTS ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                      <Volume2 className="h-5 w-5" />
                    </Button>

                    {/* Text Selection Toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dispatchUI({ type: 'SET_TEXT_SELECTION', payload: !enableTextSelection })}
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
                        <EyeOff className="h-5 w-5 " />
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
                      onClick={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'mobileOptions' })}
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
                      onClick={toggleFullscreen}
                      className={`h-9 w-9 rounded-lg transition-all ${isFullscreen ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
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
                    <div className="">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        title="Close"
                        className="h-9 w-9 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar - Gradient */}
              {numPages > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

      {/* PDF Viewer */}
      <div className="flex-1 min-h-0 relative pt-16 pb-16 sm:pb-0">
        <MemoizedPDFScrollViewer
          url={url}
          initialPage={initialPage}
          scale={scale}
          rotation={rotation}
          enableTextSelection={enableTextSelection}
          highlights={highlights}
          onPageChange={handlePageChange}
          onLoadSuccess={handlePdfDocumentLoaded}
          bookmarks={bookmarks}
          onCreateHighlight={handleCreateHighlight}
          onHighlightClick={handleJumpToHighlight}
          onTranslate={(text) => {
            setTranslationState({
              isOpen: true,
              text,
            });
          }}
          onDefine={(text) => {
            setDictionaryState({
              isOpen: true,
              text,
            });
          }}
          ref={pdfViewerRef}
        />

        {/* Thumbnails Sidebar */}
        {showThumbnails && pdfDoc && (
          <ThumbnailSidebar
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            numPages={numPages}
            onPageClick={handleJumpToPage}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'thumbnails', open: false } })}
          />
        )}

        {/* Table of Contents and Bookmarks Panel */}
        {showContentsAndBookmarksPanel && pdfDoc && (
          <PDFContentsAndBookmarksPanel
            pdfDoc={pdfDoc}
            bookmarks={bookmarks}
            currentPage={currentPage}
            onJumpToPage={handleJumpToPage}
            onEditBookmark={handleEditBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'contentsAndBookmarks', open: false } })}
          />
        )}

        {/* Search Panel */}
        {showSearch && pdfDoc && (
          <PDFSearchPanel
            pdfDoc={pdfDoc}
            onJumpToPage={handleJumpToPage}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'search', open: false } })}
          />
        )}

        {/* Highlights Panel */}
        {showHighlightsPanel && (
          <PDFHighlightsPanel
            highlights={highlights}
            isLoading={isLoadingHighlights}
            onRemoveHighlight={handleDeleteHighlight}
            onJumpToHighlight={handleJumpToHighlight}
            onChangeColor={handleHighlightColorChange}
            onSaveNote={handleHighlightNoteSave}
            onTranslate={(text) => {
              setTranslationState({
                isOpen: true,
                text,
              });
            }}
            onDefine={(text) => {
              setDictionaryState({
                isOpen: true,
                text,
              });
            }}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'highlights', open: false } })}
          />
        )}

        {/* TTS Panel */}
        {showTTS && pdfDoc && (
          <PDFTTSPanel
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            numPages={numPages}
            onPageChange={handleJumpToPage}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'tts', open: false } })}
          />
        )}

        {/* Color Filter Overlay */}
        {colorFilter !== 'none' && (
          <div 
            className={`absolute inset-0 pointer-events-none z-10 ${
              colorFilter === 'sepia' ? 'bg-amber-100/40' :
              colorFilter === 'dark' ? 'bg-gray-900/50 mix-blend-multiply' :
              ''
            }`}
            style={colorFilter === 'custom' ? { backgroundColor: customBgColor, opacity: 0.3 } : {}}
          />
        )}

        {/* Display Options Panel */}
        {showDisplayOptions && (
          <PDFDisplayOptionsPanel
            colorFilter={colorFilter}
            customBgColor={customBgColor}
            setColorFilter={(value) => dispatchUI({ type: 'SET_COLOR_FILTER', payload: value })}
            setCustomBgColor={(value) => dispatchUI({ type: 'SET_CUSTOM_BG_COLOR', payload: value })}
            scale={scale}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            rotation={rotation}
            onRotate={() => dispatchViewer({ type: 'SET_ROTATION', payload: normalizeRotationValue(rotation + 90) })}
            onResetRotation={() => dispatchViewer({ type: 'SET_ROTATION', payload: DEFAULT_ROTATION })}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'displayOptions', open: false } })}
          />
        )}

        {/* Mobile Options Panel */}
        {showMobileOptions && (
          <PDFMobileOptionsPanel
            showMobileOptions={showMobileOptions}
            onClose={() => dispatchUI({ type: 'SET_PANEL', payload: { panel: 'mobileOptions', open: false } })}
            scale={scale}
            rotation={rotation}
            enableTextSelection={enableTextSelection}
            readingMode={readingMode}
            isFullscreen={isFullscreen}
            showThumbnails={showThumbnails}
            showTTS={showTTS}
            colorFilter={colorFilter}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onRotate={() => dispatchViewer({ type: 'SET_ROTATION', payload: normalizeRotationValue(rotation + 90) })}
            onResetRotation={() => dispatchViewer({ type: 'SET_ROTATION', payload: DEFAULT_ROTATION })}
            onDecreaseRotation={() => dispatchViewer({ type: 'SET_ROTATION', payload: normalizeRotationValue(rotation - 90) })}
            onToggleThumbnails={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'thumbnails' })}
            onToggleTTS={() => dispatchUI({ type: 'TOGGLE_PANEL', payload: 'tts' })}
            onCycleColorFilter={() => {
              const themes: Array<'none' | 'sepia' | 'dark' | 'custom'> = ['none', 'sepia', 'dark', 'custom'];
              const currentIndex = themes.indexOf(colorFilter);
              const nextIndex = (currentIndex + 1) % themes.length;
              dispatchUI({ type: 'SET_COLOR_FILTER', payload: themes[nextIndex] });
            }}
            onToggleTextSelection={(value) => dispatchUI({ type: 'SET_TEXT_SELECTION', payload: value })}
            onToggleReadingMode={(value) => setReadingMode(value)}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
      </div>

      {/* Bookmark Form Modal */}
      {showBookmarkForm && (
        <BookmarkForm
          pageNumber={editingBookmark?.pageNumber || currentPage}
          initialNote={editingBookmark?.note || ''}
          onSubmit={handleBookmarkSubmit}
          onCancel={() => {
            dispatchUI({ type: 'SET_PANEL', payload: { panel: 'bookmarkForm', open: false } });
            dispatchData({ type: 'SET_EDITING_BOOKMARK', payload: null });
          }}
          isEditing={!!editingBookmark}
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
                onClick={prevPage}
                disabled={currentPage <= 1}
                className="h-10 w-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Page {currentPage}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  of {numPages}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={currentPage >= numPages}
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
    </div>
    </PDFReaderErrorBoundary>
  );
}
