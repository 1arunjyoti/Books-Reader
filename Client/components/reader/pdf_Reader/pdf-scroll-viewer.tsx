"use client";

// IMPORTANT: Configure the PDF.js worker before importing viewer components
import { ensurePdfWorker } from '@/lib/pdf-worker-init';
import { logger } from '@/lib/logger';

import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import 'react-pdf-highlighter/dist/style.css';
import {
  PdfHighlighter as PdfHighlighterComponent,
} from 'react-pdf-highlighter';
import type {
  PdfHighlighter as PdfHighlighterClass,
  T_ViewportHighlight,
} from 'react-pdf-highlighter/dist/components/PdfHighlighter';
import type {
  IHighlight,
  LTWHP,
  Scaled,
  ScaledPosition,
} from 'react-pdf-highlighter/dist/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Bookmark } from '@/lib/api';
import type { PdfHighlight, PdfHighlightRect } from '@/types/highlights';
import { PDF_HIGHLIGHT_COLORS } from './highlight-colors';
import { useMobileDetection } from '@/hooks/useMobileDetection';

type ViewerHighlight = IHighlight & {
  color: string;
  hex: string;
  original: PdfHighlight;
};

export interface CreatePdfHighlightArgs {
  position: ScaledPosition;
  text: string;
  color: string;
  hex: string;
}

type PdfDocumentProxyCompat = PDFDocumentProxy;
type PDFDocumentLoadingTask = import('pdfjs-dist/types/src/display/api').PDFDocumentLoadingTask;

export interface PDFScrollViewerHandle {
  scrollToPage: (page: number) => void;
  scrollToHighlight: (target: PdfHighlight) => void;
}

interface PDFScrollViewerProps {
  url: string;
  initialPage?: number;
  scale: number;
  rotation: number;
  enableTextSelection: boolean;
  highlights: PdfHighlight[];
  bookmarks?: Bookmark[];
  onPageChange?: (page: number, totalPages: number) => void;
  onLoadSuccess?: (numPages: number, pdfDoc: PdfDocumentProxyCompat) => void;
  onError?: (error: Error) => void;
  onCreateHighlight?: (args: CreatePdfHighlightArgs) => void | Promise<void>;
  onHighlightClick?: (highlight: PdfHighlight) => void;
}

interface SelectionToolbarProps {
  onSelect: (color: string, hex: string) => void;
  onCancel: () => void;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({ onSelect, onCancel }) => {
  return (

    /* Highlight Color Selection toolbar */
    <div className="flex items-center gap-2 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-2 shadow-lg border border-gray-200 dark:border-gray-700">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-200">Highlight</span>
      {PDF_HIGHLIGHT_COLORS.map((option) => (
        <button
          key={option.color}
          type="button"
          onClick={() => onSelect(option.color, option.hex)}
          className="h-6 w-6 rounded-full border border-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ backgroundColor: option.hex, opacity: 0.85 }}
          aria-label={`Highlight with ${option.name}`}
        />
      ))}
      <button
        type="button"
        onClick={onCancel}
        className="p-1 rounded-full text-xs text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
      >
        Cancel
      </button>
    </div>
  );
};

// Note: Our stored highlights use normalized coordinates (0-1 range)
// The library needs Scaled format with actual dimensions, but it will handle
// the viewport scaling internally. We just need to provide the coordinate ranges.
const toScaledRect = (rect: PdfHighlightRect, fallbackPage: number): Scaled => {
  const pageNumber = rect.pageNumber ?? fallbackPage;
  // For normalized coordinates (0-1), we need to preserve them as-is
  // The library will scale them to viewport coordinates
  return {
    x1: rect.x,
    y1: rect.y,
    x2: rect.x + rect.width,
    y2: rect.y + rect.height,
    // These represent the coordinate system range (normalized 0-1)
    width: 1,
    height: 1,
    pageNumber,
  };
};

const toViewerHighlight = (highlight: PdfHighlight): ViewerHighlight => {
  const boundingRect = toScaledRect(highlight.boundingRect, highlight.pageNumber);
  const rects = highlight.rects.map((rect) => toScaledRect(rect, highlight.pageNumber));

  return {
    id: highlight.id,
    position: {
      pageNumber: highlight.pageNumber,
      boundingRect,
      rects,
    },
    content: {
      text: highlight.text,
    },
    comment: {
      text: highlight.note ?? '',
      emoji: '',
    },
    color: highlight.color,
    hex: highlight.hex,
    original: highlight,
  };
};

interface ProgressiveLoadingProps {
  loadingProgress: number;
}

const ProgressiveLoadingFallback: React.FC<ProgressiveLoadingProps> = ({ loadingProgress }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="w-full max-w-md px-4">
      <div className="flex flex-col items-center gap-4 text-gray-700 dark:text-gray-200">
        {/* Animated spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-lg font-semibold mb-1">Loading PDF...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {loadingProgress < 100 
              ? 'Downloading and preparing document' 
              : 'Almost ready...'}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {Math.round(loadingProgress)}%
            </span>
          </div>
        </div>
        
        {/* Helpful tip */}
        {loadingProgress > 0 && loadingProgress < 100 && (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
            Large PDFs may take a moment to load
          </p>
        )}
      </div>
    </div>
  </div>
);

interface PdfViewerInnerProps extends Omit<PDFScrollViewerProps, 'url'> {
  pdfDocument: PdfDocumentProxyCompat;
}

const PdfViewerInner = React.forwardRef<PDFScrollViewerHandle, PdfViewerInnerProps>(({
  pdfDocument,
  initialPage = 1,
  scale,
  rotation,
  enableTextSelection,
  highlights,
  bookmarks = [],
  onPageChange,
  onLoadSuccess,
  onCreateHighlight,
  onHighlightClick,
}, ref) => {
  const highlighterRef = useRef<PdfHighlighterClass<ViewerHighlight> | null>(null);
  const scrollToHighlightRef = useRef<((highlight: ViewerHighlight) => void) | null>(null);
  const hasLoadedRef = useRef(false);
  
  // Mobile detection for performance optimizations
  const isMobile = useMobileDetection();

  const viewerHighlights = useMemo(() => {
    return highlights.map(toViewerHighlight);
  }, [highlights]);

  // Only call onLoadSuccess once when document first loads
  useEffect(() => {
    if (!hasLoadedRef.current) {
      onLoadSuccess?.(pdfDocument.numPages, pdfDocument);
      hasLoadedRef.current = true;
    }
  }, [onLoadSuccess, pdfDocument]);

  // Reset loaded flag when document changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [pdfDocument]);

  // Configure viewer for mobile optimization
  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    if (!viewerInstance) return;

    // Optimize page rendering buffer based on device type
    // Mobile: Render fewer pages to save memory and CPU
    // Desktop: Render more pages for smoother scrolling
    
    // Access internal rendering queue (private API but necessary for optimization)
    type ViewerWithQueue = typeof viewerInstance & {
      _renderingQueue?: {
        renderingQueue: number;
        highestPriorityPage: number;
      };
    };
    
    const viewerWithQueue = viewerInstance as ViewerWithQueue;
    const defaultRenderingQueue = viewerWithQueue._renderingQueue;
    
    if (defaultRenderingQueue) {
      // Set higher priority threshold on mobile (render fewer pages)
      // Lower number = more aggressive culling of off-screen pages
      if (isMobile) {
        defaultRenderingQueue.renderingQueue = 2; // Max 2 pages in rendering queue
        defaultRenderingQueue.highestPriorityPage = 1; // Prioritize current page only
      } else {
        defaultRenderingQueue.renderingQueue = 6; // Desktop can handle more
        defaultRenderingQueue.highestPriorityPage = 3;
      }
    }

    // Configure scroll mode for better mobile performance
    if (isMobile && viewerInstance.scrollMode !== undefined) {
      // Use vertical scroll mode on mobile (more efficient)
      viewerInstance.scrollMode = 0; // VERTICAL = 0
    }
  }, [isMobile]);

  // Add passive touch event listeners for better mobile performance
  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    const viewerNode = viewerInstance?.viewer as HTMLElement | undefined;
    if (!viewerNode || !isMobile) return;

    const handleTouchStart = () => {
      // Improves touch responsiveness by marking touch as handled
    };

    const handleTouchMove = () => {
      // Improves scroll performance during touch gestures
    };

    // Add passive listeners for better scrolling performance on mobile
    viewerNode.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewerNode.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      viewerNode.removeEventListener('touchstart', handleTouchStart);
      viewerNode.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile]);

  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    if (!viewerInstance) {
      return;
    }
    
    // Wait for the viewer to be fully initialized
    const scrollToInitialPage = () => {
      const boundedPage = Math.min(Math.max(initialPage, 1), pdfDocument.numPages);
      
      if (boundedPage !== 1 && viewerInstance.pdfDocument) {
        // Set the page number
        viewerInstance.currentPageNumber = boundedPage;
        
        // Verify the page is set correctly after a brief delay
        // This ensures the scroll position is properly applied
        setTimeout(() => {
          if (viewerInstance.currentPageNumber !== boundedPage) {
            viewerInstance.currentPageNumber = boundedPage;
          }
        }, 100);
      }
    };
    
    // Wait for the viewer to be fully ready
    const timer = setTimeout(scrollToInitialPage, 200);
    
    return () => clearTimeout(timer);
  }, [initialPage, pdfDocument.numPages]);

  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    if (!viewerInstance) return;
    
    // Ensure viewer is initialized before setting rotation
    if (!viewerInstance.pdfDocument || viewerInstance.pagesCount === 0) {
      return;
    }
    
    if (viewerInstance.pagesRotation !== rotation) {
      viewerInstance.pagesRotation = rotation;
    }
  }, [rotation]);

  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;
    
    // Ensure viewer is initialized before handling scale
    const viewerInstance = highlighter.viewer;
    if (!viewerInstance || !viewerInstance.pdfDocument || viewerInstance.pagesCount === 0) {
      return;
    }
    
    highlighter.handleScaleValue();
  }, [scale]);

  useEffect(() => {
    const highlighter = highlighterRef.current;
    if (!highlighter) return;
    const toggleSelection = () => {
      if (!highlighter.viewer || !highlighter.viewer.viewer) {
        return false;
      }
      highlighter.toggleTextSelection(!enableTextSelection);
      return true;
    };

    if (!toggleSelection()) {
      const timeout = window.setTimeout(() => {
        toggleSelection();
      }, 150);
      return () => window.clearTimeout(timeout);
    }

    return () => undefined;
  }, [enableTextSelection]);

  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    if (!viewerInstance || !viewerInstance.eventBus) return;

    const handlePageChanging = ({ pageNumber }: { pageNumber: number }) => {
      onPageChange?.(pageNumber, pdfDocument.numPages);
      
      // On mobile, aggressively cleanup pages that are far from current view
      if (isMobile) {
        const viewerNode = viewerInstance.viewer as HTMLElement | undefined;
        if (!viewerNode) return;
        
        // Cleanup pages more than 2 pages away from current page
        const bufferPages = 2;
        const pagesToCleanup: number[] = [];
        
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          if (Math.abs(i - pageNumber) > bufferPages) {
            pagesToCleanup.push(i);
          }
        }
        
        // Cleanup canvases for far-away pages
        pagesToCleanup.forEach((pageNum) => {
          const pageElement = viewerNode.querySelector<HTMLElement>(
            `.page[data-page-number="${pageNum}"]`
          );
          if (pageElement) {
            const canvas = pageElement.querySelector('canvas');
            if (canvas) {
              const context = canvas.getContext('2d');
              if (context) {
                // Clear the canvas to free memory
                context.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          }
        });
      }
    };

    viewerInstance.eventBus.on('pagechanging', handlePageChanging);

    return () => {
      viewerInstance.eventBus.off('pagechanging', handlePageChanging);
    };
  }, [onPageChange, pdfDocument.numPages, isMobile]);

  // Add scroll listener to handle mouse wheel scrolling
  // PDF.js's pagechanging event may not fire consistently during rapid mouse scrolling
  useEffect(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    const viewerNode = viewerInstance?.viewer as HTMLElement | undefined;
    if (!viewerNode || !viewerInstance) return;

    let lastReportedPage = viewerInstance.currentPageNumber || initialPage;
    let rafId: number | null = null;

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame to throttle scroll events
      rafId = requestAnimationFrame(() => {
        const currentPage = viewerInstance.currentPageNumber;
        
        // Only call onPageChange if the page actually changed
        if (currentPage && currentPage !== lastReportedPage) {
          lastReportedPage = currentPage;
          onPageChange?.(currentPage, pdfDocument.numPages);
        }
      });
    };

    // Listen to scroll events on the viewer container
    viewerNode.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      viewerNode.removeEventListener('scroll', handleScroll);
    };
  }, [onPageChange, pdfDocument.numPages, initialPage]);

  // Track existing bookmark ribbons to avoid unnecessary re-renders
  const existingRibbonsRef = useRef<Set<number>>(new Set());

  const scrollToPage = useCallback((pageNumber: number) => {
    const viewerInstance = highlighterRef.current?.viewer;
    if (!viewerInstance) {
      return;
    }
    const boundedPage = Math.min(Math.max(pageNumber, 1), pdfDocument.numPages);
    viewerInstance.currentPageNumber = boundedPage;
  }, [pdfDocument.numPages]);

  const scrollToHighlight = useCallback((target: PdfHighlight) => {
    if (!scrollToHighlightRef.current) {
      return;
    }
    const viewerHighlight = viewerHighlights.find((item) => item.id === target.id);
    if (viewerHighlight) {
      scrollToHighlightRef.current(viewerHighlight);
    }
  }, [viewerHighlights]);

  useImperativeHandle(ref, () => ({
    scrollToPage,
    scrollToHighlight,
  }), [scrollToPage, scrollToHighlight]);

  const renderBookmarkIndicators = useCallback(() => {
    const viewerInstance = highlighterRef.current?.viewer;
    const viewerNode = viewerInstance?.viewer as HTMLElement | undefined;
    if (!viewerNode) return;

    // Mobile optimization: Use smaller ribbon sizes on mobile devices
    const baseRibbonWidth = isMobile ? 30 : 40;
    const baseRibbonHeight = isMobile ? 45 : 60;
    const ribbonWidth = baseRibbonWidth * scale;
    const ribbonHeight = baseRibbonHeight * scale;

    // Get current bookmark page numbers
    const currentBookmarkPages = new Set(bookmarks.map(b => b.pageNumber));
    
    // Get existing ribbon page numbers from DOM
    const existingRibbonElements = viewerNode.querySelectorAll('.br-bookmark-ribbon');
    const existingInDOM = new Set<number>();
    existingRibbonElements.forEach((el) => {
      const pageNum = el.getAttribute('data-bookmark-page');
      if (pageNum) existingInDOM.add(Number(pageNum));
    });

    // Remove ribbons for bookmarks that no longer exist
    existingInDOM.forEach(pageNum => {
      if (!currentBookmarkPages.has(pageNum)) {
        const ribbon = viewerNode.querySelector(`.br-bookmark-ribbon[data-bookmark-page="${pageNum}"]`);
        ribbon?.remove();
        existingRibbonsRef.current.delete(pageNum);
      }
    });

    // Add or update ribbons for current bookmarks
    bookmarks.forEach((bookmark) => {
      const pageNode = viewerNode.querySelector<HTMLElement>(`.page[data-page-number="${bookmark.pageNumber}"]`);
      if (!pageNode) return;

      const existingRibbon = pageNode.querySelector<HTMLElement>(`.br-bookmark-ribbon[data-bookmark-page="${bookmark.pageNumber}"]`);
      
      if (existingRibbon) {
        // Update existing ribbon styles (for scale changes)
        existingRibbon.style.width = `${ribbonWidth}px`;
        existingRibbon.style.height = `${ribbonHeight}px`;
      } else {
        // Create new ribbon
        const ribbon = document.createElement('div');
        ribbon.className = 'br-bookmark-ribbon';
        ribbon.setAttribute('data-bookmark-page', String(bookmark.pageNumber));
        ribbon.style.position = 'absolute';
        ribbon.style.top = '0';
        ribbon.style.right = '0';
        ribbon.style.width = `${ribbonWidth}px`;
        ribbon.style.height = `${ribbonHeight}px`;
        ribbon.style.background = '#2563eb';
        ribbon.style.clipPath = 'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)';
        ribbon.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.25)';
        ribbon.style.opacity = '0.9';
        ribbon.style.zIndex = '5';
        pageNode.appendChild(ribbon);
        existingRibbonsRef.current.add(bookmark.pageNumber);
      }
    });
  }, [bookmarks, scale, isMobile]);

  useEffect(() => {
    if (bookmarks.length === 0) {
      const viewerInstance = highlighterRef.current?.viewer;
      const viewerNode = viewerInstance?.viewer as HTMLElement | undefined;
      viewerNode?.querySelectorAll('.br-bookmark-ribbon').forEach((node) => node.remove());
      existingRibbonsRef.current.clear();
      return;
    }

    const timeout = window.setTimeout(renderBookmarkIndicators, 150);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [bookmarks, renderBookmarkIndicators, scale, rotation]);

  const handleScrollRef = useCallback((scrollTo: (highlight: ViewerHighlight) => void) => {
    scrollToHighlightRef.current = scrollTo;
  }, []);

  const highlightTransform = useCallback(
    (
      highlight: T_ViewportHighlight<ViewerHighlight>,
    ) => {
      const { rects } = highlight.position;
      
      return (
        <div 
          className="pointer-events-auto"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
          }}
        >
          {rects.map((rect: LTWHP, idx: number) => {
            return (
              <div
                key={`${highlight.id}-${idx}`}
                onClick={() => onHighlightClick?.(highlight.original)}
                role="presentation"
                className="pdf-highlight-overlay"
                style={{
                  position: 'absolute',
                  left: `${rect.left}px`,
                  top: `${rect.top}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundColor: highlight.hex,
                  opacity: 0.5,
                  cursor: 'pointer',
                  borderRadius: '2px',
                  transition: 'opacity 0.2s',
                  pointerEvents: 'auto',
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.5';
                }}
              />
            );
          })}
        </div>
      );
    },
    [onHighlightClick],
  );

  const handleSelectionFinished = useCallback(
    (
      position: ScaledPosition,
      content: { text?: string },
      hideTipAndSelection: () => void,
      transformSelection: () => void,
    ) => {
      if (!enableTextSelection || !onCreateHighlight) {
        return null;
      }

      const selectionText = content.text?.trim();
      if (!selectionText) {
        return null;
      }

      const handleSelectColor = (color: string, hex: string) => {
        transformSelection();
        onCreateHighlight({ position, text: selectionText, color, hex });
        hideTipAndSelection();
      };

      const handleCancel = () => {
        hideTipAndSelection();
      };

      return <SelectionToolbar onSelect={handleSelectColor} onCancel={handleCancel} />;
    },
    [enableTextSelection, onCreateHighlight],
  );

  // Always pass highlights to the component, regardless of viewer ready state
  // This ensures highlights are rendered as soon as the viewer is initialized
  const highlightsToRender = viewerHighlights;
  
  return (
    <PdfHighlighterComponent
      ref={highlighterRef}
      pdfDocument={pdfDocument}
      pdfScaleValue={scale.toString()}
      highlights={highlightsToRender}
      onSelectionFinished={handleSelectionFinished}
      onScrollChange={() => undefined}
      scrollRef={handleScrollRef}
      highlightTransform={highlightTransform}
      enableAreaSelection={() => false}
    />
  );
});

PdfViewerInner.displayName = 'PdfViewerInner';

const PDFScrollViewer = React.forwardRef<PDFScrollViewerHandle, PDFScrollViewerProps>(({ url, ...props }, ref) => {
  const [workerReady, setWorkerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<PdfDocumentProxyCompat | null>(null);
  const pdfDocumentRef = useRef<PdfDocumentProxyCompat | null>(null);

  // Ensure PDF.js worker is initialized
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let mounted = true;

    ensurePdfWorker()
      .then(() => {
        if (mounted) {
          setWorkerReady(true);
        }
      })
      .catch((err) => {
        logger.error('[PDF] Failed to initialize worker:', err);
        if (mounted) {
          setError('Failed to initialize PDF viewer');
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!workerReady) {
      return;
    }

  let cancelled = false;
  let loadingTask: PDFDocumentLoadingTask | null = null;

    const load = async () => {
      try {
        setError(null);
        setLoadingProgress(0);
        setPdfDocument(null);

        if (pdfDocumentRef.current) {
          await pdfDocumentRef.current.destroy();
          pdfDocumentRef.current = null;
        }

        const pdfjsLib = await import('pdfjs-dist');
        if (cancelled) {
          return;
        }

        loadingTask = pdfjsLib.getDocument({ url });
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (!cancelled && total > 0) {
            setLoadingProgress(Math.min(100, Math.round((loaded / total) * 100)));
          }
        };

        const documentProxy = await loadingTask.promise;
        if (cancelled) {
          await documentProxy.destroy();
          return;
        }

        pdfDocumentRef.current = documentProxy;
        setPdfDocument(documentProxy);
        setLoadingProgress(100);
      } catch (err) {
        if (!cancelled) {
          logger.error('[PDF] Failed to load document:', err);
          setError('Failed to load PDF document');
        }
        if (loadingTask) {
          void loadingTask.destroy();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (loadingTask) {
        void loadingTask.destroy();
      }
    };
  }, [url, workerReady]);

  useEffect(() => {
    return () => {
      if (pdfDocumentRef.current) {
        void pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (!workerReady || !pdfDocument) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
        <ProgressiveLoadingFallback loadingProgress={loadingProgress} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-100 dark:bg-gray-900">
      <PdfViewerInner
        pdfDocument={pdfDocument}
        ref={ref}
        {...props}
      />
    </div>
  );
});

PDFScrollViewer.displayName = 'PDFScrollViewer';

const propsAreEqual = (prevProps: PDFScrollViewerProps, nextProps: PDFScrollViewerProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.initialPage === nextProps.initialPage &&
    prevProps.scale === nextProps.scale &&
    prevProps.rotation === nextProps.rotation &&
    prevProps.enableTextSelection === nextProps.enableTextSelection &&
    prevProps.highlights === nextProps.highlights &&
    prevProps.bookmarks === nextProps.bookmarks &&
    prevProps.onPageChange === nextProps.onPageChange &&
    prevProps.onLoadSuccess === nextProps.onLoadSuccess &&
    prevProps.onCreateHighlight === nextProps.onCreateHighlight &&
    prevProps.onHighlightClick === nextProps.onHighlightClick
  );
};

export const MemoizedPDFScrollViewer = React.memo(PDFScrollViewer, propsAreEqual);
