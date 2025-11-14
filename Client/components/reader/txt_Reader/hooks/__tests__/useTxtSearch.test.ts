/**
 * TXT Search Hook Unit Tests
 * Tests the useTxtSearch custom hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTxtSearch } from '@/components/reader/txt_Reader/hooks/useTxtSearch';
import '@testing-library/jest-dom';
import { MutableRefObject } from 'react';

describe('useTxtSearch', () => {
  const mockSections = [
    'The quick brown fox jumps over the lazy dog.',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'The quick fox runs quickly through the forest.',
    'Programming is the art of solving problems with code.',
  ];

  const mockSectionRefs: MutableRefObject<(HTMLDivElement | null)[]> = {
    current: [
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
      document.createElement('div'),
    ],
  };

  // Mock scrollIntoView
  beforeEach(() => {
    mockSectionRefs.current.forEach((div) => {
      if (div) {
        div.scrollIntoView = jest.fn();
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty values', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.currentSearchIndex).toBe(0);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchProgress).toBe(0);
    });
  });

  describe('Search Query Management', () => {
    it('should update search query', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('quick');
      });

      expect(result.current.searchQuery).toBe('quick');
    });
  });

  describe('Search Execution', () => {
    it('should find all occurrences of a search term', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('quick');
      });

      act(() => {
        result.current.handleSearch();
      });

      // Should find 'quick' in sections 0 and 2
      expect(result.current.searchResults.length).toBe(3); // "quick" appears 3 times total
      expect(result.current.searchResults[0].sectionIndex).toBe(0);
      expect(result.current.searchResults[1].sectionIndex).toBe(2);
      expect(result.current.searchResults[2].sectionIndex).toBe(2);
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('QUICK');
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(result.current.searchResults.length).toBe(3);
    });

    it('should provide excerpts with context', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('fox');
      });

      act(() => {
        result.current.handleSearch();
      });

      // Should have excerpts
      expect(result.current.searchResults[0].excerpt).toContain('fox');
      expect(result.current.searchResults[0].excerpt.length).toBeGreaterThan(3);
    });

    it('should not search with empty query', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('');
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(result.current.searchResults).toEqual([]);
    });

    it('should not search with whitespace-only query', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('   ');
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(result.current.searchResults).toEqual([]);
    });

    it('should validate maximum query length', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
          maxQueryLength: 10,
        })
      );

      act(() => {
        result.current.setSearchQuery('a'.repeat(20)); // Longer than max
      });

      act(() => {
        result.current.handleSearch();
      });

      // Should not search due to length validation
      expect(result.current.searchResults).toEqual([]);
    });

    it('should limit search results to max count', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
          maxResults: 2,
        })
      );

      act(() => {
        result.current.setSearchQuery('e'); // Common letter
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(result.current.searchResults.length).toBeLessThanOrEqual(2);
    });

    it('should prevent concurrent searches', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      // Start first search
      act(() => {
        result.current.handleSearch();
      });

      // Try to start second search while first is running (should be prevented)
      act(() => {
        result.current.handleSearch();
      });

      // Should complete without errors
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe('Search Navigation', () => {
    beforeEach(() => {
      // Setup with existing search results
    });

    it('should navigate to next search result', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      // Perform search
      act(() => {
        result.current.setSearchQuery('the');
      });

      // Wait for state to update, then search
      await waitFor(() => {
        expect(result.current.searchQuery).toBe('the');
      });

      act(() => {
        result.current.handleSearch();
      });

      // Wait for search results
      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const initialIndex = result.current.currentSearchIndex;

      act(() => {
        result.current.goToNextSearchResult();
      });

      // Index should increase (or wrap to 0 if at end)
      expect(result.current.currentSearchIndex).not.toBe(initialIndex);
    });

    it('should wrap around to first result after last', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('the');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('the');
      });

      act(() => {
        result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const totalResults = result.current.searchResults.length;
      expect(totalResults).toBeGreaterThan(0);

      // Navigate to last result
      act(() => {
        result.current.setCurrentSearchIndex(totalResults - 1);
      });

      expect(result.current.currentSearchIndex).toBe(totalResults - 1);

      // Go to next (should wrap to 0)
      act(() => {
        result.current.goToNextSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(0);
    });

    it('should navigate to previous search result', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('the');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('the');
      });

      act(() => {
        result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      // Navigate forward first to have a previous item
      act(() => {
        result.current.setCurrentSearchIndex(2);
      });

      const currentIndex = result.current.currentSearchIndex;
      expect(currentIndex).toBe(2);

      act(() => {
        result.current.goToPrevSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(currentIndex - 1);
    });

    it('should wrap around to last result when going back from first', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('the');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('the');
      });

      act(() => {
        result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const totalResults = result.current.searchResults.length;
      expect(totalResults).toBeGreaterThan(0);

      // Ensure we're at index 0
      expect(result.current.currentSearchIndex).toBe(0);

      // At index 0, go to previous (should wrap to last)
      act(() => {
        result.current.goToPrevSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(totalResults - 1);
    });

    it('should scroll to result section when navigating', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('fox');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('fox');
      });

      act(() => {
        result.current.handleSearch();
      });

      // Verify we have results
      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.goToNextSearchResult();
      });

      // Should call scrollIntoView on the section
      const currentIndex = result.current.currentSearchIndex;
      if (result.current.searchResults[currentIndex]) {
        const targetSection = result.current.searchResults[currentIndex].sectionIndex;
        expect(mockSectionRefs.current[targetSection]?.scrollIntoView).toHaveBeenCalled();
      }
    });

    it('should handle navigation with no results gracefully', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      // Try to navigate without search results
      act(() => {
        result.current.goToNextSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(0);

      act(() => {
        result.current.goToPrevSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(0);
    });
  });

  describe('Search Clear', () => {
    it('should clear search query and results', () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      // Perform search
      act(() => {
        result.current.setSearchQuery('test');
        result.current.handleSearch();
      });

      // Clear
      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.currentSearchIndex).toBe(0);
    });
  });

  describe('Search Progress', () => {
    it('should update progress during search', () => {
      const largeSections = Array(100).fill('test content');

      const { result } = renderHook(() =>
        useTxtSearch({
          sections: largeSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      act(() => {
        result.current.handleSearch();
      });

      // Progress should reach 100% when complete
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchProgress).toBeGreaterThan(0);
    });
  });

  describe('Position Tracking', () => {
    it('should track exact position of matches', async () => {
      const { result } = renderHook(() =>
        useTxtSearch({
          sections: mockSections,
          sectionRefs: mockSectionRefs,
        })
      );

      act(() => {
        result.current.setSearchQuery('quick');
      });

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('quick');
      });

      act(() => {
        result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const firstResult = result.current.searchResults[0];
      
      expect(firstResult).toBeDefined();
      expect(firstResult.position).toBeDefined();
      expect(firstResult.position.start).toBeGreaterThanOrEqual(0);
      expect(firstResult.position.end).toBeGreaterThan(firstResult.position.start);
    });
  });
});
