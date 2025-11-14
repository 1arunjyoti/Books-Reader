import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { API_ENDPOINTS } from '@/lib/config';

const API_BASE_URL = API_ENDPOINTS.HIGHLIGHTS_BASE;

export interface Highlight {
  id: string;
  bookId: string;
  text: string;
  color: string;
  hex: string;
  note?: string;
  source: string;
  sectionIndex: number;
  position: { start: number; end: number };
  cfiRange?: string;
}

export interface PendingSelection {
  text: string;
  position: { start: number; end: number };
  sectionIndex: number;
  mouseX: number;
  mouseY: number;
  highlightId?: string;
}

interface UseTxtHighlightsOptions {
  bookId: string;
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

interface UseTxtHighlightsReturn {
  highlights: Highlight[];
  isLoadingHighlights: boolean;
  pendingSelection: PendingSelection | null;
  setPendingSelection: (selection: PendingSelection | null) => void;
  handleColorSelect: (color: string, hex: string) => Promise<void>;
  handleRemoveHighlight: (highlightId: string) => Promise<void>;
  handleJumpToHighlight: (sectionIndex: number) => void;
  handleSaveNote: (highlightId: string, note: string) => Promise<void>;
  handleChangeColor: (highlightId: string) => void;
}

/**
 * Custom hook for managing TXT file highlights
 * Handles CRUD operations, color changes, notes, and navigation
 */
export function useTxtHighlights({
  bookId,
  sectionRefs,
}: UseTxtHighlightsOptions): UseTxtHighlightsReturn {
  const { getAccessToken } = useAuthToken();
  
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoadingHighlights, setIsLoadingHighlights] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);
  
  const highlightAbortControllerRef = useRef<AbortController | null>(null);

  // Load highlights from API
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        // PERFORMANCE: Cancel any previous request
        if (highlightAbortControllerRef.current) {
          highlightAbortControllerRef.current.abort();
        }
        
        highlightAbortControllerRef.current = new AbortController();
        
        setIsLoadingHighlights(true);
        const token = await getAccessToken();
        if (!token) {
          logger.warn('User not authenticated. Please log in to view highlights.');
          setIsLoadingHighlights(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/${bookId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: highlightAbortControllerRef.current.signal,
        });

        // Handle 404 gracefully - it means no highlights exist yet (valid state)
        if (response.status === 404) {
          setHighlights([]);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          // Filter for TXT highlights
          const txtHighlights = (data.highlights || data || []).filter((h: Highlight) => h.source === 'TXT' || !h.source);
          
          // Parse cfiRange if it contains TXT-specific data
          const processedHighlights = txtHighlights.map((h: Highlight) => {
            // Default values for safety
            const defaults = {
              sectionIndex: 0,
              position: { start: 0, end: 0 },
            };

            try {
              if (h.cfiRange && typeof h.cfiRange === 'string') {
                const parsedData = JSON.parse(h.cfiRange);
                return {
                  ...h,
                  sectionIndex: parsedData.sectionIndex ?? defaults.sectionIndex,
                  position: parsedData.position ?? defaults.position,
                };
              }
            } catch (error) {
              // If parsing fails, use defaults
              logger.warn(`Failed to parse highlight position for highlight ${h.id}:`, error);
            }
            
            // Return with defaults if no cfiRange or parsing failed
            return {
              ...h,
              sectionIndex: h.sectionIndex ?? defaults.sectionIndex,
              position: h.position ?? defaults.position,
            };
          });
          
          setHighlights(processedHighlights);
        } else {
          // Log other non-OK responses (not 404)
          logger.warn(`Failed to load highlights: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // SECURITY: Don't log sensitive information, check if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          logger.log('Highlight loading was cancelled');
        } else {
          logger.error('Error loading highlights:', error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        setIsLoadingHighlights(false);
      }
    };

    if (bookId) {
      loadHighlights();
    }
    
    // MEMORY LEAK FIX: Cleanup function to abort requests on unmount
    return () => {
      if (highlightAbortControllerRef.current) {
        highlightAbortControllerRef.current.abort();
      }
    };
  }, [bookId, getAccessToken]);

  // Create or update highlight
  const handleColorSelect = useCallback(async (color: string, hex: string) => {
    if (!pendingSelection) return;

    try {
      const token = await getAccessToken();
      if (!token) {
        logger.warn('User not authenticated. Please log in to create highlights.');
        return;
      }

      const existingHighlightId = pendingSelection.highlightId;

      if (existingHighlightId) {
        // Update existing highlight color
        const response = await fetch(`${API_BASE_URL}/${existingHighlightId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ color, hex }),
        });

        if (!response.ok) {
          // Parse error response with proper fallback
          let errorMessage = 'Failed to update highlight';
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorData?.message || JSON.stringify(errorData) || errorMessage;
          } catch {
            // If response is not JSON, try to get text
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
          }
          
          logger.error('Highlight update failed:', new Error(errorMessage));
          throw new Error(errorMessage);
        }

        const updatedHighlight = await response.json();
        
        // Preserve TXT-specific data when updating
        setHighlights(prev => prev.map(h => {
          if (h.id === existingHighlightId) {
            return {
              ...updatedHighlight,
              sectionIndex: h.sectionIndex,
              position: h.position,
            };
          }
          return h;
        }));
      } else {
        // Create new highlight
        const response = await fetch(`${API_BASE_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookId,
            text: pendingSelection.text,
            color,
            hex,
            source: 'TXT',
            cfiRange: JSON.stringify({
              sectionIndex: pendingSelection.sectionIndex,
              position: pendingSelection.position,
            }),
          }),
        });

        if (!response.ok) {
          // Parse error response with proper fallback
          let errorMessage = 'Failed to create highlight';
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorData?.message || JSON.stringify(errorData) || errorMessage;
          } catch {
            // If response is not JSON, try to get text
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`;
          }
          
          logger.error('Highlight creation failed:', new Error(errorMessage));
          throw new Error(errorMessage);
        }

        const newHighlight = await response.json();
        
        const highlightWithTxtData = {
          ...newHighlight,
          sectionIndex: pendingSelection.sectionIndex,
          position: pendingSelection.position,
        };
        
        setHighlights(prev => [...prev, highlightWithTxtData]);
      }
      
      setPendingSelection(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      // Log with better error context
      const errorMessage = 
        error instanceof Error ? error.message : 
        typeof error === 'string' ? error :
        JSON.stringify(error) || 'Unknown error';
      
      if (errorMessage) {
        logger.error('Error saving highlight:', new Error(errorMessage));
      } else {
        logger.error('Error saving highlight: Unknown error occurred', error);
      }
    }
  }, [pendingSelection, getAccessToken, bookId]);

  // Remove highlight
  const handleRemoveHighlight = useCallback(async (highlightId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/${highlightId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setHighlights(prev => prev.filter(h => h.id !== highlightId));
      } else {
        // Handle error response
        let errorMessage = `Failed to remove highlight (HTTP ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // Ignore JSON parse error, use default message
        }
        logger.error('Error removing highlight:', new Error(errorMessage));
      }
    } catch (error) {
      const errorMessage = 
        error instanceof Error ? error.message : 
        typeof error === 'string' ? error :
        JSON.stringify(error) || 'Unknown error';
      
      if (errorMessage) {
        logger.error('Error removing highlight:', new Error(errorMessage));
      } else {
        logger.error('Error removing highlight: Unknown error occurred', error);
      }
    }
  }, [getAccessToken]);

  // Jump to highlight
  const handleJumpToHighlight = useCallback((sectionIndex: number) => {
    setTimeout(() => {
      sectionRefs.current[sectionIndex]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  }, [sectionRefs]);

  // Save note
  const handleSaveNote = useCallback(async (highlightId: string, note: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/${highlightId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      if (response.ok) {
        const updated = await response.json();
        
        // Preserve TXT-specific data when updating note
        setHighlights(prev => prev.map(h => {
          if (h.id === highlightId) {
            return {
              ...updated,
              sectionIndex: h.sectionIndex,
              position: h.position,
            };
          }
          return h;
        }));
      } else {
        // Handle error response
        let errorMessage = `Failed to save note (HTTP ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
        } catch {
          // Ignore JSON parse error, use default message
        }
        logger.error('Error saving note:', new Error(errorMessage));
      }
    } catch (error) {
      const errorMessage = 
        error instanceof Error ? error.message : 
        typeof error === 'string' ? error :
        JSON.stringify(error) || 'Unknown error';
      
      if (errorMessage) {
        logger.error('Error saving note:', new Error(errorMessage));
      } else {
        logger.error('Error saving note: Unknown error occurred', error);
      }
    }
  }, [getAccessToken]);

  // Change highlight color
  const handleChangeColor = useCallback((highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (!highlight) return;

    setPendingSelection({
      text: highlight.text,
      position: highlight.position,
      sectionIndex: highlight.sectionIndex,
      mouseX: window.innerWidth / 2,
      mouseY: window.innerHeight / 2,
      highlightId: highlightId,
    });
  }, [highlights]);

  return {
    highlights,
    isLoadingHighlights,
    pendingSelection,
    setPendingSelection,
    handleColorSelect,
    handleRemoveHighlight,
    handleJumpToHighlight,
    handleSaveNote,
    handleChangeColor,
  };
}
