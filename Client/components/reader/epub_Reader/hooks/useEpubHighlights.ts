import { useState, useCallback, useRef, useEffect } from 'react';
import type { Rendition, Contents } from 'epubjs';
import type { EpubHighlight } from '@/types/highlights';
import {
  createHighlight as apiCreateHighlight,
  fetchHighlights,
  deleteHighlight as apiDeleteHighlight,
  updateHighlight as apiUpdateHighlight,
} from '@/lib/highlights-api';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { sanitizeText } from '@/lib/sanitize-text';
import { logger } from '@/lib/logger';

interface SelectionInfo {
  text: string;
  cfiRange: string;
  x: number;
  y: number;
  height: number;
}

interface EditingInfo {
  id: string;
  cfiRange: string;
  x: number;
  y: number;
  height: number;
}

interface UseEpubHighlightsProps {
  bookId: string;
  renditionRef: React.MutableRefObject<Rendition | undefined>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useEpubHighlights({
  bookId,
  renditionRef,
  onSuccess,
  onError,
}: UseEpubHighlightsProps) {
  const { getAccessToken } = useAuthToken();
  
  const [highlights, setHighlights] = useState<EpubHighlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(true);
  const [pendingSelection, setPendingSelection] = useState<SelectionInfo | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<EditingInfo | null>(null);
  
  // Track applied highlights to prevent duplicates
  const appliedHighlightsRef = useRef<Set<string>>(new Set());
  const highlightsRef = useRef<EpubHighlight[]>([]);
  const applyHighlightsRef = useRef<(() => void) | null>(null);
  const renderListenerRef = useRef<(() => void) | null>(null);
  const relocateListenerRef = useRef<(() => void) | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update ref when highlights change
  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  // Set up rendition event listeners to reapply highlights on page changes
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    // Create the applyHighlights function
    const applyHighlights = () => {
      const currentHighlights = highlightsRef.current;
      
      logger.log('Applying highlights (effect version):', {
        count: currentHighlights.length,
        highlights: currentHighlights.map(h => ({
          id: h.id,
          text: h.text?.substring(0, 50),
          cfiRange: h.cfiRange
        }))
      });
      
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
            logger.log('Removing old highlight:', cfi);
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
            logger.log('Adding new highlight:', {
              cfiRange: highlight.cfiRange,
              text: highlight.text?.substring(0, 50),
              color: highlight.hex
            });
            rendition.annotations.add(
              'highlight',
              highlight.cfiRange,
              {},
              undefined,
              'hl',
              {
                fill: highlight.hex,
                'fill-opacity': '1',
              }
            );
            appliedHighlightsRef.current.add(highlight.cfiRange);
          } catch (error) {
            logger.error('Error applying highlight', { cfiRange: highlight.cfiRange, error });
          }
        }
      });
    };

    // Store the function in ref for access from listeners
    applyHighlightsRef.current = applyHighlights;

    // MEMORY LEAK FIX: Only set up listeners once, not on every highlight change
    if (!renderListenerRef.current || !relocateListenerRef.current) {
      // DUPLICATE PROCESS FIX: Create debounced version to prevent race conditions
      // When both 'rendered' and 'relocated' events fire simultaneously (within 100ms),
      // only one highlight application occurs
      const applyHighlightsDebounced = () => {
        // Clear any pending application
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // HIGHLIGHT RENDERING FIX: Proper highlight re-rendering after layout changes
        // Schedule application after delay to ensure layout is complete
        debounceTimerRef.current = setTimeout(() => {
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
          debounceTimerRef.current = null;
        }, 100);
      };
      
      // Create stable listener functions
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
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [highlights, renditionRef]);

  // Clean up listeners only when component unmounts
  useEffect(() => {
    const currentRendition = renditionRef.current;
    return () => {
      if (currentRendition && renderListenerRef.current && relocateListenerRef.current) {
        try {
          currentRendition.off('rendered', renderListenerRef.current);
          currentRendition.off('relocated', relocateListenerRef.current);
          renderListenerRef.current = null;
          relocateListenerRef.current = null;
        } catch (err) {
          logger.error('Error cleaning up highlight listeners:', err);
        }
      }
    };
  }, [renditionRef]);

  // Load highlights from API
  const loadHighlights = useCallback(async () => {
    try {
      setIsLoadingHighlights(true);
      // Use centralized token management
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('Failed to get access token for highlights');
        onError?.('Failed to load highlights. Please try refreshing the page.');
        return;
      }
      
      const data = await fetchHighlights(bookId, accessToken);
      // Filter to only include EPUB highlights since this is an EPUB reader
      const epubHighlights = data.filter((h): h is EpubHighlight => h.source === 'EPUB');
      
      // Sanitize all fetched highlights to prevent XSS from stored data
      // This provides defense-in-depth alongside React's built-in JSX escaping
      const sanitizedHighlights = epubHighlights.map(h => ({
        ...h,
        text: sanitizeText(h.text, { maxLength: 5000, allowNewlines: true }),
        note: h.note ? sanitizeText(h.note, { maxLength: 1000, allowNewlines: true }) : undefined,
      }));
      
      setHighlights(sanitizedHighlights);
    } catch (err) {
      logger.error('Error loading highlights:', err);
      onError?.('Failed to load highlights. Some highlights may not be visible.');
    } finally {
      setIsLoadingHighlights(false);
    }
  }, [bookId, getAccessToken, onError]);

  // Apply highlights to rendition
  const applyHighlights = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const currentHighlights = highlightsRef.current;
    
    logger.log('Applying highlights (exported function):', {
      count: currentHighlights.length,
      highlights: currentHighlights.map(h => ({
        id: h.id,
        text: h.text?.substring(0, 50),
        cfiRange: h.cfiRange
      }))
    });
    
    currentHighlights.forEach((highlight) => {
      if (!appliedHighlightsRef.current.has(highlight.cfiRange)) {
        try {
          logger.log('Adding highlight:', {
            cfiRange: highlight.cfiRange,
            text: highlight.text?.substring(0, 50),
            color: highlight.hex
          });
          rendition.annotations.add(
            'highlight',
            highlight.cfiRange,
            {},
            undefined,
            'hl', // Match the effect version
            {
              fill: highlight.hex,
              'fill-opacity': '1', // Match the effect version
            }
          );
          appliedHighlightsRef.current.add(highlight.cfiRange);
        } catch (err) {
          logger.error('Failed to apply highlight:', err);
        }
      }
    });
  }, [renditionRef, highlightsRef]);

  // Remove all highlights from rendition
  const clearRenditionHighlights = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    try {
      rendition.annotations.remove('*', 'highlight');
      appliedHighlightsRef.current.clear();
    } catch (err) {
      logger.error('Failed to clear highlights:', err);
    }
  }, [renditionRef]);

  // Reapply all highlights (useful after font changes)
  const reapplyHighlights = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    // Remove all current highlights first
    appliedHighlightsRef.current.forEach((cfi) => {
      try {
        rendition.annotations.remove(cfi, 'highlight');
      } catch {
        // Ignore errors during cleanup
      }
    });
    appliedHighlightsRef.current.clear();

    // Reapply highlights with new positioning
    // Small delay ensures layout changes are fully rendered
    setTimeout(() => {
      applyHighlights();
    }, 50);
  }, [renditionRef, applyHighlights]);

  // Handle text selection for highlighting
  const handleTextSelected = useCallback(
    (cfiRange: string, contents: Contents) => {
      if (!cfiRange || !contents) return;

      const selection = contents.window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Sanitize text immediately upon selection to prevent XSS
      const sanitizedText = sanitizeText(selectedText, {
        maxLength: 5000,
        allowNewlines: true,
        trimWhitespace: true,
      });

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const iframe = contents.document.defaultView?.frameElement as HTMLIFrameElement;
      
      if (!iframe) return;

      const iframeRect = iframe.getBoundingClientRect();

      // Calculate absolute position relative to viewport
      const x = iframeRect.left + rect.left + rect.width / 2;
      const y = iframeRect.top + rect.top;
      const height = rect.height;

      // Store pending selection with sanitized text
      setPendingSelection({
        text: sanitizedText,
        cfiRange,
        x,
        y,
        height,
      });
    },
    []
  );

  // Create new highlight
  const createHighlight = useCallback(
    async (color: { name: string; color: string; hex: string }, pageNumber: number) => {
      if (!pendingSelection) return;

      try {
        // text is already sanitized in handleTextSelected
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        const newHighlight = await apiCreateHighlight(
          bookId,
          {
            text: pendingSelection.text, // Already sanitized in handleTextSelected
            cfiRange: pendingSelection.cfiRange,
            color: color.color,
            hex: color.hex,
            pageNumber,
            source: 'EPUB',
          },
          accessToken
        );

        // Type guard to ensure it's an EPUB highlight
        if (newHighlight.source === 'EPUB') {
          setHighlights((prev) => [...prev, newHighlight as EpubHighlight]);
          
          // Apply the new highlight (match original implementation)
          const rendition = renditionRef.current;
          if (rendition) {
            rendition.annotations.add(
              'highlight',
              pendingSelection.cfiRange,
              {},
              undefined,
              'hl',
              {
                fill: color.hex,
                'fill-opacity': '1', // Set to 1, let CSS opacity handle transparency
              }
            );
            appliedHighlightsRef.current.add(pendingSelection.cfiRange);
          }
        }

        setPendingSelection(null);
        //onSuccess?.('Highlight created');
      } catch (err) {
        logger.error('Failed to create highlight:', err);
        onError?.('Failed to create highlight');
      }
    },
    [pendingSelection, bookId, getAccessToken, renditionRef, onError]
  );

  // Update highlight color
  const updateHighlightColor = useCallback(
    async (highlightId: string, color: { name: string; color: string; hex: string }) => {
      const rendition = renditionRef.current;
      if (!rendition) return;

      // Find the highlight being updated
      const highlight = highlightsRef.current.find(h => h.id === highlightId);
      if (!highlight) return;

      const { cfiRange } = highlight;

      try {
        // ORIGINAL PATTERN: Remove old annotation immediately
        rendition.annotations.remove(cfiRange, 'highlight');
        appliedHighlightsRef.current.delete(cfiRange);

        // Add new annotation with updated color
        rendition.annotations.add(
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

        // Update in database
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }
        await apiUpdateHighlight(
          highlightId,
          { color: color.color, hex: color.hex },
          accessToken
        );

        // Update state
        setHighlights((prev) =>
          prev.map((h) => (h.id === highlightId ? { ...h, color: color.color, hex: color.hex } : h))
        );

        setEditingHighlight(null);
        //onSuccess?.('Highlight color updated');
      } catch (err) {
        logger.error('Failed to update highlight color:', err);
        
        // Re-add original highlight if update failed
        if (rendition) {
          rendition.annotations.add(
            'highlight',
            cfiRange,
            {},
            undefined,
            'hl',
            {
              fill: highlight.hex,
              'fill-opacity': '1',
            }
          );
          appliedHighlightsRef.current.add(cfiRange);
        }
        
        onError?.('Failed to update highlight color');
        setEditingHighlight(null);
      }
    },
    [renditionRef, getAccessToken, onError]
  );

  // Save note to highlight
  const saveHighlightNote = useCallback(
    async (highlightId: string, note: string) => {
      try {
        // Sanitize note before saving to prevent XSS attacks
        const sanitizedNote = sanitizeText(note, {
          maxLength: 1000,
          allowNewlines: true,
          trimWhitespace: true,
        });
        
        // Use centralized token management
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token for highlight note update');
          onError?.('Unable to save note. Please try again.');
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
        //onSuccess?.('Note saved');
      } catch (err) {
        logger.error('Error saving note:', err);
        onError?.('Failed to save note');
      }
    },
    [getAccessToken, onError]
  );

  // Remove highlight
  const removeHighlight = useCallback(
    async (highlightId: string, cfiRange: string) => {
      const rendition = renditionRef.current;
      if (!rendition) return;
      
      try {
        // Remove from EPUB.js annotations FIRST (like original)
        rendition.annotations.remove(cfiRange, 'highlight');
        appliedHighlightsRef.current.delete(cfiRange);
        
        // Remove from state
        setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
        
        // Use centralized token management
        const accessToken = await getAccessToken();
        if (!accessToken) {
          logger.error('Failed to get access token for highlight deletion');
          onError?.('Unable to delete highlight. Please try again.');
          return;
        }
        
        await apiDeleteHighlight(highlightId, accessToken);
        onSuccess?.('Highlight removed');
      } catch (err) {
        logger.error('Error removing highlight:', err);
        onError?.('Failed to remove highlight. Please try again.');
        // Optionally re-add the highlight if deletion failed
        // setHighlights((prev) => [...prev, highlight]);
        // rendition.annotations.add(...)
      }
    },
    [renditionRef, getAccessToken, onSuccess, onError]
  );

  // Navigate to highlight
  const jumpToHighlight = useCallback(
    (cfiRange: string) => {
      const rendition = renditionRef.current;
      if (rendition) {
        try {
          rendition.display(cfiRange);
        } catch (err) {
          logger.error('Failed to navigate to highlight:', err);
          onError?.('Failed to navigate to highlight');
        }
      }
    },
    [renditionRef, onError]
  );

  // Initiate color change for highlight
  const initiateColorChange = useCallback((highlightId: string, cfiRange: string) => {
    // For color change from the panel, we'll show the color picker at a fixed position
    // We just need to track which highlight is being edited
    setEditingHighlight({ 
      id: highlightId, 
      cfiRange, 
      x: window.innerWidth / 2,  // Center of screen
      y: window.innerHeight / 2, // Middle of screen
      height: 0 
    });
  }, []);

  // Update highlight page numbers after locations are generated
  const updateHighlightPageNumbers = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (book: any) => {
      if (!book?.locations?.locationFromCfi) return;
      
      logger.log('Updating highlight page numbers after location generation');
      
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
    },
    []
  );

  return {
    // State
    highlights,
    isLoadingHighlights,
    pendingSelection,
    editingHighlight,
    
    // Setters
    setPendingSelection,
    setEditingHighlight,
    
    // Actions
    loadHighlights,
    applyHighlights,
    clearRenditionHighlights,
    reapplyHighlights,
    handleTextSelected,
    createHighlight,
    updateHighlightColor,
    saveHighlightNote,
    removeHighlight,
    jumpToHighlight,
    initiateColorChange,
    updateHighlightPageNumbers,
  };
}
