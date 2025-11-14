import { useState, useCallback, useRef } from 'react';
import type { Rendition } from 'epubjs';
import { logger } from '@/lib/logger';

interface SearchResult {
  cfi: string;
  excerpt: string;
}

interface UseEpubSearchProps {
  renditionRef: React.MutableRefObject<Rendition | undefined>;
}

export function useEpubSearch({ renditionRef }: UseEpubSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  const searchResultsRef = useRef<SearchResult[]>([]);

  // PERFORMANCE FIX: Optimized search with chunking, cancellation, and progress tracking
  const handleSearch = useCallback(
    async () => {
      const rendition = renditionRef.current;
      if (!searchQuery || !rendition || isSearching) return;

      // Cancel any existing search
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }

      searchAbortControllerRef.current = new AbortController();
      const { signal } = searchAbortControllerRef.current;

      setIsSearching(true);
      setSearchProgress(0);

      const results: SearchResult[] = [];
      const book = rendition.book;

      try {
        await book.ready;

        // Clear previous highlights
        searchResults.forEach((result) => {
          rendition.annotations.remove(result.cfi, 'highlight');
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
            rendition.annotations.add(
              'highlight',
              results[i].cfi,
              {},
              undefined,
              'search-highlight',
              { fill: 'yellow', 'fill-opacity': '0.5' }
            );
          }

          // Navigate to first result
            if (results.length > 0) {
              rendition.display(results[0].cfi);
            }

            logger.log('Search complete:', { resultsCount: results.length });
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
    },
    [renditionRef, searchQuery, isSearching, searchResults]
  );

  // Navigate to next search result
  const goToNextSearchResult = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition || searchResults.length === 0) return;

    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    rendition.display(searchResults[nextIndex].cfi);
  }, [renditionRef, searchResults, currentSearchIndex]);

  // Navigate to previous search result
  const goToPrevSearchResult = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition || searchResults.length === 0) return;

    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    rendition.display(searchResults[prevIndex].cfi);
  }, [renditionRef, searchResults, currentSearchIndex]);

  // Navigate to specific search result by index
  const goToSearchResult = useCallback((index: number) => {
    const rendition = renditionRef.current;
    if (!rendition || searchResults.length === 0 || index < 0 || index >= searchResults.length) return;

    setCurrentSearchIndex(index);
    rendition.display(searchResults[index].cfi);
  }, [renditionRef, searchResults]);

  // Cancel ongoing search
  const cancelSearch = useCallback(() => {
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
      searchAbortControllerRef.current = null;
    }
    setIsSearching(false);
    setSearchProgress(0);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    const rendition = renditionRef.current;
    
    // Cancel any ongoing search first
    cancelSearch();
    
    // Remove all search highlights
    searchResults.forEach((result) => {
      rendition?.annotations.remove(result.cfi, 'highlight');
    });
    
    setSearchResults([]);
    searchResultsRef.current = []; // MEMORY LEAK FIX: Clear ref as well
    setSearchQuery('');
    setCurrentSearchIndex(0);
  }, [renditionRef, searchResults, cancelSearch]);

  // Toggle search panel
  const toggleSearchPanel = useCallback(() => {
    setShowSearchPanel((prev) => !prev);
  }, []);

  return {
    // State
    searchQuery,
    searchResults,
    currentSearchIndex,
    isSearching,
    searchProgress,
    showSearchPanel,
    
    // Setters
    setSearchQuery,
    setShowSearchPanel,
    
    // Actions
    handleSearch,
    goToNextSearchResult,
    goToPrevSearchResult,
    goToSearchResult,
    cancelSearch,
    clearSearch,
    toggleSearchPanel,
  };
}
