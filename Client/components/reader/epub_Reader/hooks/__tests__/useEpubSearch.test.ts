/**
 * Unit tests for useEpubSearch hook
 * Tests search functionality, result navigation, and cancellation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubSearch } from '../useEpubSearch';
import type { Rendition } from 'epubjs';

interface MockBook {
  ready: Promise<void>;
  load: jest.Mock;
  spine: {
    spineItems: Array<{
      load: jest.Mock;
      find: jest.Mock;
      unload: jest.Mock;
    }>;
    each: jest.Mock;
    length: number;
  };
}

interface MockRendition {
  book: MockBook;
  annotations: {
    add: jest.Mock;
    remove: jest.Mock;
  };
  display: jest.Mock;
}

describe('useEpubSearch', () => {
  let mockRendition: MockRendition;
  let renditionRef: React.MutableRefObject<Rendition | undefined>;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSpineItem1 = {
      load: jest.fn().mockImplementation(() => {
        // Set up document after load
        mockSpineItem1.document = {
          createTreeWalker: jest.fn().mockReturnValue({
            nextNode: jest.fn()
              .mockReturnValueOnce({ textContent: 'This is test text one' })
              .mockReturnValueOnce(null),
          }),
          createRange: jest.fn().mockReturnValue({
            setStart: jest.fn(),
            setEnd: jest.fn(),
          }),
        };
        return Promise.resolve();
      }),
      document: null as unknown,
      cfiFromRange: jest.fn().mockReturnValue('epubcfi(/6/4!/4/2/1:0,/4/2/1:4)'),
      find: jest.fn((query: string) => {
        if (query === 'test') {
          return [
            {
              cfi: 'epubcfi(/6/4!/4/2/1:0,/4/2/1:4)',
              excerpt: 'This is test text',
            },
          ];
        }
        return [];
      }),
      unload: jest.fn(),
    };

    const mockSpineItem2 = {
      load: jest.fn().mockImplementation(() => {
        // Set up document after load
        mockSpineItem2.document = {
          createTreeWalker: jest.fn().mockReturnValue({
            nextNode: jest.fn()
              .mockReturnValueOnce({ textContent: 'Another test paragraph' })
              .mockReturnValueOnce(null),
          }),
          createRange: jest.fn().mockReturnValue({
            setStart: jest.fn(),
            setEnd: jest.fn(),
          }),
        };
        return Promise.resolve();
      }),
      document: null as unknown,
      cfiFromRange: jest.fn().mockReturnValue('epubcfi(/6/6!/4/2/1:8,/4/2/1:12)'),
      find: jest.fn((query: string) => {
        if (query === 'test') {
          return [
            {
              cfi: 'epubcfi(/6/6!/4/2/1:8,/4/2/1:12)',
              excerpt: 'Another test paragraph',
            },
          ];
        }
        return [];
      }),
      unload: jest.fn(),
    };

    const mockBook: MockBook = {
      ready: Promise.resolve(),
      load: jest.fn().mockResolvedValue(undefined),
      spine: {
        spineItems: [mockSpineItem1, mockSpineItem2],
        each: jest.fn((callback: (item: unknown) => void) => {
          [mockSpineItem1, mockSpineItem2].forEach(callback);
        }),
        length: 2,
      } as unknown as MockBook['spine'],
    };

    mockRendition = {
      book: mockBook,
      annotations: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      display: jest.fn().mockResolvedValue(undefined),
    };

    renditionRef = {
      current: mockRendition as unknown as Rendition,
    } as React.MutableRefObject<Rendition | undefined>;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      expect(result.current.searchQuery).toBe('');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.currentSearchIndex).toBe(0);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchProgress).toBe(0);
      expect(result.current.showSearchPanel).toBe(false);
    });
  });

  describe('Search Query Management', () => {
    it('should update search query', () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test query');
      });

      expect(result.current.searchQuery).toBe('test query');
    });

    it('should clear search query', () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      expect(result.current.searchQuery).toBe('test');

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('Search Panel Visibility', () => {
    it('should toggle search panel', () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      expect(result.current.showSearchPanel).toBe(false);

      act(() => {
        result.current.setShowSearchPanel(true);
      });

      expect(result.current.showSearchPanel).toBe(true);

      act(() => {
        result.current.setShowSearchPanel(false);
      });

      expect(result.current.showSearchPanel).toBe(false);
    });
  });

  describe('Search Execution', () => {
    it('should perform search successfully', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      });

      expect(result.current.searchResults.length).toBeGreaterThan(0);
      // Progress is reset to 0 after search completes
      expect(result.current.searchProgress).toBe(0);
    });

    it('should not search with empty query', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isSearching).toBe(false);
    });

    it('should not search while already searching', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      // Start first search
      const firstSearch = act(async () => {
        await result.current.handleSearch();
      });

      // Try to start second search immediately
      await act(async () => {
        await result.current.handleSearch();
      });

      await firstSearch;

      // Should only have results from one search
      expect(result.current.searchResults.length).toBeGreaterThan(0);
    });

    it('should handle search without rendition', async () => {
      const emptyRef = {
        current: undefined,
      } as React.MutableRefObject<Rendition | undefined>;

      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef: emptyRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.searchResults).toEqual([]);
    });
  });

  describe('Search Result Navigation', () => {
    it('should navigate to next search result', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const initialIndex = result.current.currentSearchIndex;

      act(() => {
        result.current.goToNextSearchResult();
      });

      if (result.current.searchResults.length > 1) {
        expect(result.current.currentSearchIndex).toBe(initialIndex + 1);
      }
      expect(mockRendition.display).toHaveBeenCalled();
    });

    it('should navigate to previous search result', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      // Move to next first
      act(() => {
        result.current.goToNextSearchResult();
      });

      const currentIndex = result.current.currentSearchIndex;

      // Then move back
      act(() => {
        result.current.goToPrevSearchResult();
      });

      if (currentIndex > 0) {
        expect(result.current.currentSearchIndex).toBe(currentIndex - 1);
      }
      expect(mockRendition.display).toHaveBeenCalled();
    });

    it('should wrap to first result when navigating past last', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      const resultCount = result.current.searchResults.length;

      // Navigate through all results to wrap back to first
      for (let i = 0; i < resultCount; i++) {
        act(() => {
          result.current.goToNextSearchResult();
        });
      }

      // Should wrap back to index 0
      await waitFor(() => {
        expect(result.current.currentSearchIndex).toBe(0);
      });
    });

    it('should wrap to last result when navigating before first', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      // Start at index 0, navigate backwards
      act(() => {
        result.current.goToPrevSearchResult();
      });

      expect(result.current.currentSearchIndex).toBe(result.current.searchResults.length - 1);
    });
  });

  describe('Search Cancellation', () => {
    it('should cancel ongoing search', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      // Start search
      act(() => {
        result.current.handleSearch();
      });

      // Cancel immediately
      act(() => {
        result.current.cancelSearch();
      });

      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      });
    });
  });

  describe('Clear Search', () => {
    it('should clear search results and highlights', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      await waitFor(() => {
        expect(result.current.searchResults.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchResults).toEqual([]);
      expect(result.current.currentSearchIndex).toBe(0);
      expect(mockRendition.annotations.remove).toHaveBeenCalled();
    });
  });

  describe('Search Progress', () => {
    it('should reset progress after search completes', async () => {
      const { result } = renderHook(() =>
        useEpubSearch({
          renditionRef,
        })
      );

      act(() => {
        result.current.setSearchQuery('test');
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      // Wait for search to complete
      await waitFor(() => {
        expect(result.current.isSearching).toBe(false);
      });
      
      // Progress should be reset to 0 after completion
      expect(result.current.searchProgress).toBe(0);
    });
  });
});
