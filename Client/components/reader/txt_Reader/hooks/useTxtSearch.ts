import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface SearchResult {
  sectionIndex: number;
  position: { start: number; end: number };
  excerpt: string;
}

interface UseTxtSearchOptions {
  sections: string[];
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  maxQueryLength?: number;
  maxResults?: number;
}

interface UseTxtSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  setCurrentSearchIndex: (index: number) => void;
  isSearching: boolean;
  searchProgress: number;
  handleSearch: () => void;
  goToNextSearchResult: () => void;
  goToPrevSearchResult: () => void;
  clearSearch: () => void;
}

/**
 * Custom hook for TXT file search functionality
 * Handles search query, results pagination, and navigation
 */
export function useTxtSearch({
  sections,
  sectionRefs,
  maxQueryLength = 200,
  maxResults = 500,
}: UseTxtSearchOptions): UseTxtSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  // Perform search across all sections
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || isSearching) return;
    
    // SECURITY: Validate search query length
    if (searchQuery.length > maxQueryLength) {
      logger.warn('Search query too long');
      return;
    }

    setIsSearching(true);
    setSearchProgress(0);
    const results: SearchResult[] = [];

    // Search through all sections
    const query = searchQuery.toLowerCase();
    
    sections.forEach((section, sectionIndex) => {
      // PERFORMANCE: Stop if we've reached max results
      if (results.length >= maxResults) return;
      
      const sectionLower = section.toLowerCase();
      let startIndex = 0;

      while (results.length < maxResults) {
        const index = sectionLower.indexOf(query, startIndex);
        if (index === -1) break;

        // Extract excerpt
        const excerptStart = Math.max(0, index - 40);
        const excerptEnd = Math.min(section.length, index + query.length + 40);
        const excerpt = section.slice(excerptStart, excerptEnd);

        results.push({
          sectionIndex,
          position: { start: index, end: index + query.length },
          excerpt,
        });

        startIndex = index + 1;
      }

      setSearchProgress(Math.round(((sectionIndex + 1) / sections.length) * 100));
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);
    setIsSearching(false);

    // Navigate to first result by scrolling
    if (results.length > 0) {
      setTimeout(() => {
        sectionRefs.current[results[0].sectionIndex]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [searchQuery, sections, isSearching, maxQueryLength, maxResults, sectionRefs]);

  const goToNextSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    // Scroll to section with search result
    const sectionIndex = searchResults[nextIndex].sectionIndex;
    sectionRefs.current[sectionIndex]?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, [searchResults, currentSearchIndex, sectionRefs]);

  const goToPrevSearchResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIndex);
    // Scroll to section with search result
    const sectionIndex = searchResults[prevIndex].sectionIndex;
    sectionRefs.current[sectionIndex]?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, [searchResults, currentSearchIndex, sectionRefs]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    isSearching,
    searchProgress,
    handleSearch,
    goToNextSearchResult,
    goToPrevSearchResult,
    clearSearch,
  };
}
