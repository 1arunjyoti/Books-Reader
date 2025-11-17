"use client";

import React, { useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface SearchResult {
  pageNumber: number;
  text: string;
  matchIndex: number;
}

interface PDFSearchPanelProps {
  pdfDoc: PDFDocumentProxy | null;
  onJumpToPage: (page: number) => void;
  onClose: () => void;
}

// Batch size for processing pages - prevents UI freeze
const SEARCH_BATCH_SIZE = 10;

function PDFSearchPanel({
  pdfDoc,
  onJumpToPage,
  onClose,
}: PDFSearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(async () => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      setSearchProgress(0);
      return;
    }

    // Cancel any ongoing search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setSearching(true);
      setSearchProgress(0);
      const results: SearchResult[] = [];
      const numPages = pdfDoc.numPages;
      const query = searchQuery.toLowerCase();

      // Process pages in batches to prevent UI freeze
      for (let i = 0; i < numPages; i += SEARCH_BATCH_SIZE) {
        // Check if search was cancelled
        if (abortController.signal.aborted) {
          return;
        }

        const batch = Math.min(SEARCH_BATCH_SIZE, numPages - i);
        
        // Process batch of pages in parallel
        const batchResults = await Promise.all(
          Array.from({ length: batch }, async (_, j) => {
            const pageNum = i + j + 1;
            const pageMatches: SearchResult[] = [];

            try {
              const page = await pdfDoc.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: { str?: string }) => item.str || '')
                .join(' ');

              // Find all matches on this page
              let index = 0;
              let matchIndex = 0;
              const lowerPageText = pageText.toLowerCase();
              
              while ((index = lowerPageText.indexOf(query, index)) !== -1) {
                const start = Math.max(0, index - 40);
                const end = Math.min(pageText.length, index + query.length + 40);
                const snippet = pageText.substring(start, end);

                pageMatches.push({
                  pageNumber: pageNum,
                  text: snippet,
                  matchIndex: matchIndex++,
                });

                index += query.length;
              }

              // Clean up page resources
              if (page && typeof page.cleanup === 'function') {
                page.cleanup();
              }
            } catch (err) {
              logger.error(`Error searching page ${pageNum}:`, err);
            }

            return pageMatches;
          })
        );

        // Flatten batch results and add to total results
        results.push(...batchResults.flat());

        // Update progress
        const progress = Math.round(((i + batch) / numPages) * 100);
        setSearchProgress(progress);

        // Yield to UI thread between batches
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      setSearchResults(results);
      setCurrentResultIndex(results.length > 0 ? 0 : -1);
      setSearchProgress(100);

      // Jump to first result
      if (results.length > 0) {
        onJumpToPage(results[0].pageNumber);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        logger.log('Search cancelled');
      } else {
        logger.error('Error searching PDF:', err);
      }
    } finally {
      setSearching(false);
      abortControllerRef.current = null;
    }
  }, [pdfDoc, searchQuery, onJumpToPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const cancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setSearching(false);
      setSearchProgress(0);
    }
  };

  // Cleanup abort controller on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Allow Escape key to cancel search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searching) {
        e.preventDefault();
        cancelSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searching]);

  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    onJumpToPage(searchResults[nextIndex].pageNumber);
  };

  const goToPreviousResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    onJumpToPage(searchResults[prevIndex].pageNumber);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Search in PDF
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter search term..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              autoFocus
              disabled={searching}
            />
            {searching ? (
              <Button 
                type="button" 
                size="sm" 
                variant="destructive" 
                onClick={cancelSearch}
                className="min-w-[70px]"
                title="Cancel search (Esc)"
              >
                Cancel
              </Button>
            ) : (
              <Button 
                type="submit" 
                size="sm" 
                disabled={!searchQuery.trim()}
                className="min-w-[70px]"
              >
                Search
              </Button>
            )}
          </div>

          {/* Progress Bar - Enhanced visibility */}
          {searching && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm text-blue-900 dark:text-blue-100">
                <span className="font-medium">Searching PDF...</span>
                <span className="font-semibold">{searchProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${searchProgress}%` }}
                />
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 text-center">
                Press Cancel or Esc to stop
              </div>
            </div>
          )}

          {/* Navigation */}
          {searchResults.length > 0 && !searching && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                {currentResultIndex + 1} of {searchResults.length} results
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousResult}
                  className="h-8 w-8"
                  title="Previous result"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextResult}
                  className="h-8 w-8"
                  title="Next result"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {searching ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <div
                key={`${result.pageNumber}-${result.matchIndex}`}
                onClick={() => {
                  setCurrentResultIndex(index);
                  onJumpToPage(result.pageNumber);
                }}
                className={`
                  p-3 rounded-md cursor-pointer transition-colors
                  ${index === currentResultIndex
                    ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                  }
                `}
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Page {result.pageNumber}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                  {highlightText(result.text, searchQuery)}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery && !searching ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No results found for &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Enter a search term to find text in the PDF
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const propsAreEqual = (prevProps: PDFSearchPanelProps, nextProps: PDFSearchPanelProps) => {
  return (
    prevProps.pdfDoc === nextProps.pdfDoc &&
    prevProps.onJumpToPage === nextProps.onJumpToPage &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(PDFSearchPanel, propsAreEqual);
