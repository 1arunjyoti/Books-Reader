/**
 * EPUB Reader Component Integration Tests
 * Tests the integration between multiple EPUB reader hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import '@testing-library/jest-dom';
import * as api from '@/lib/api';
import * as highlightsApi from '@/lib/highlights-api';
import { useEpubBookmarks } from '@/components/reader/epub_Reader/hooks/useEpubBookmarks';
import { useEpubNavigation } from '@/components/reader/epub_Reader/hooks/useEpubNavigation';
import type { Rendition } from 'epubjs';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/lib/highlights-api');
jest.mock('@/contexts/AuthTokenContext', () => ({
  useAuthToken: () => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Create test wrapper
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface WrapperProps {
  children: React.ReactNode;
}

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  return Wrapper;
};

describe('EPUB Reader Multi-Hook Integration Tests', () => {
  const mockBookId = 'integration-book-123';
  const mockAccessToken = 'mock-token';

  const mockBookmarks = [
    {
      id: 'bookmark-1',
      bookId: mockBookId,
      userId: 'user-123',
      pageNumber: 10,
      note: 'Test bookmark 1',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'bookmark-2',
      bookId: mockBookId,
      userId: 'user-123',
      pageNumber: 25,
      note: 'Test bookmark 2',
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
  ];

  const mockHighlights = [
    {
      id: 'highlight-1',
      bookId: mockBookId,
      userId: 'user-123',
      cfiRange: 'epubcfi(/6/4[chap01]!/4/2/4[par002]/1:0,/6/4[chap01]!/4/2/4[par002]/1:20)',
      text: 'Highlighted text 1',
      note: 'Note 1',
      color: 'yellow',
      hex: '#ffff00',
      source: 'epub' as const,
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
  ];

  // Create mock rendition
  const createMockRendition = () => {
    const mockRendition = {
      display: jest.fn().mockResolvedValue({}),
      on: jest.fn(),
      off: jest.fn(),
      prev: jest.fn().mockResolvedValue({}),
      next: jest.fn().mockResolvedValue({}),
      themes: {
        default: jest.fn(),
        register: jest.fn(),
        select: jest.fn(),
        fontSize: jest.fn(),
      },
      annotations: {
        add: jest.fn(),
        remove: jest.fn(),
      },
      book: {
        locations: {
          generate: jest.fn().mockResolvedValue([]),
          total: 100,
          locationFromCfi: jest.fn().mockReturnValue(1),
        },
        navigation: {
          toc: [
            {
              id: 'chap1',
              href: 'chapter1.xhtml',
              label: 'Chapter 1',
              subitems: [],
            },
            {
              id: 'chap2',
              href: 'chapter2.xhtml',
              label: 'Chapter 2',
              subitems: [],
            },
          ],
        },
      },
    };
    return mockRendition as unknown as Rendition;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
    (highlightsApi.fetchHighlights as jest.Mock).mockResolvedValue(mockHighlights);
  });

  describe('Bookmarks and Navigation Integration', () => {
    it('should load bookmarks and navigate using next/previous', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };
      const onPageChange = jest.fn();

      // Initialize navigation hook
      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
            onPageChange,
          }),
        { wrapper: createWrapper() }
      );

      // Initialize bookmarks hook
      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // Load bookmarks
      await act(async () => {
        await bookmarksResult.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(bookmarksResult.current.bookmarks).toHaveLength(2);
      });

      // Navigate using next page
      await act(async () => {
        await navResult.current.goToNextPage();
      });

      await waitFor(() => {
        expect(mockRendition.next).toHaveBeenCalled();
      });
    });

    it('should handle TOC navigation', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      const { result } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      // Get TOC from hook (it's set during initialization via rendition)
      await act(async () => {
        result.current.setToc(mockRendition.book.navigation.toc);
      });

      await waitFor(() => {
        expect(result.current.toc).toHaveLength(2);
        expect(result.current.toc[0].label).toBe('Chapter 1');
      });
    });

    it('should navigate to next and previous pages', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };
      const onPageChange = jest.fn();

      const { result } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
            onPageChange,
          }),
        { wrapper: createWrapper() }
      );

      // Navigate forward
      await act(async () => {
        await result.current.goToNextPage();
      });

      expect(mockRendition.next).toHaveBeenCalled();

      // Navigate backward
      await act(async () => {
        await result.current.goToPrevPage();
      });

      expect(mockRendition.prev).toHaveBeenCalled();
    });
  });

  describe('Multiple Hooks State Synchronization', () => {
    it('should maintain independent state for bookmarks and navigation', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      // Initialize both hooks
      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // Load bookmarks
      await act(async () => {
        await bookmarksResult.current.loadBookmarks();
      });

      // Navigate using next page instead of going to specific page
      await act(async () => {
        navResult.current.goToNextPage();
      });

      // Both should maintain their state
      await waitFor(() => {
        expect(bookmarksResult.current.bookmarks).toHaveLength(2);
        expect(mockRendition.next).toHaveBeenCalled();
      });
    });

    it('should handle concurrent operations gracefully', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      (api.createBookmark as jest.Mock).mockResolvedValue({
        id: 'new-bookmark',
        bookId: mockBookId,
        userId: 'user-123',
        pageNumber: 15,
        note: 'Concurrent test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // Perform concurrent operations
      await act(async () => {
        await Promise.all([
          bookmarksResult.current.loadBookmarks(),
          navResult.current.goToNextPage(),
          bookmarksResult.current.handleBookmarkSubmit('Test', 15, 'epubcfi(/6/4)'),
        ]);
      });

      // Verify all operations completed
      expect(api.fetchBookmarks).toHaveBeenCalled();
      expect(mockRendition.next).toHaveBeenCalled();
      expect(api.createBookmark).toHaveBeenCalled();
    });
  });

  describe('Error Handling Across Hooks', () => {
    it('should handle API errors without affecting other hooks', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      // Make bookmarks fail
      (api.fetchBookmarks as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // Try to load bookmarks (will fail)
      await act(async () => {
        await bookmarksResult.current.loadBookmarks();
      });

      // Navigation should still work
      await act(async () => {
        await navResult.current.goToNextPage();
      });

      expect(mockRendition.next).toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should handle navigation errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const mockRendition = createMockRendition();
      mockRendition.next = jest.fn().mockRejectedValue(new Error('Navigation Error'));
      const renditionRef = { current: mockRendition };

      const { result } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      // Try to navigate (will fail)
      await act(async () => {
        await result.current.goToNextPage();
      });

      // Hook should still be functional
      expect(result.current.pageInfo).toBeDefined();
      consoleError.mockRestore();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should handle rapid navigation without memory leaks', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      const { result } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      // Perform rapid navigation
      await act(async () => {
        for (let i = 0; i < 20; i++) {
          await result.current.goToNextPage();
        }
      });

      // Should complete without issues
      expect(mockRendition.next).toHaveBeenCalledTimes(20);
    });

    it('should manage multiple bookmarks efficiently', async () => {
      const manyBookmarks = Array.from({ length: 100 }, (_, i) => ({
        id: `bookmark-${i}`,
        bookId: mockBookId,
        userId: 'user-123',
        pageNumber: i + 1,
        note: `Bookmark ${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      (api.fetchBookmarks as jest.Mock).mockResolvedValue(manyBookmarks);

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      const startTime = Date.now();

      await act(async () => {
        await result.current.loadBookmarks();
      });

      const endTime = Date.now();

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(100);
      });

      // Should load in reasonable time (< 200ms)
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Lifecycle and Cleanup', () => {
    it('should cleanup properly when unmounted', () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      const { unmount } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rendition changes', async () => {
      const mockRendition1 = createMockRendition();
      const mockRendition2 = createMockRendition();
      const renditionRef = { current: mockRendition1 };

      const { rerender, result } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      // Change rendition
      renditionRef.current = mockRendition2;
      rerender();

      // Should work with new rendition
      await act(async () => {
        await result.current.goToNextPage();
      });

      expect(mockRendition2.next).toHaveBeenCalled();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should support reading workflow: load bookmarks -> navigate -> create bookmark', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      (api.createBookmark as jest.Mock).mockResolvedValue({
        id: 'new-reading-bookmark',
        bookId: mockBookId,
        userId: 'user-123',
        pageNumber: 30,
        note: 'Important passage',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // 1. Load existing bookmarks
      await act(async () => {
        await bookmarksResult.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(bookmarksResult.current.bookmarks).toHaveLength(2);
      });

      // 2. Navigate forward
      await act(async () => {
        await navResult.current.goToNextPage();
      });

      // 3. Create a new bookmark
      await act(async () => {
        await bookmarksResult.current.handleBookmarkSubmit(
          'Important passage',
          30,
          'epubcfi(/6/30)'
        );
      });

      expect(api.createBookmark).toHaveBeenCalledWith(
        {
          bookId: mockBookId,
          pageNumber: 30,
          note: 'Important passage',
        },
        mockAccessToken
      );
    });

    it('should support bookmark navigation using CFI', async () => {
      const mockRendition = createMockRendition();
      const renditionRef = { current: mockRendition };

      const { result: navResult } = renderHook(
        () =>
          useEpubNavigation({
            renditionRef: renditionRef as React.MutableRefObject<Rendition | undefined>,
          }),
        { wrapper: createWrapper() }
      );

      const { result: bookmarksResult } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      // Load bookmarks
      await act(async () => {
        await bookmarksResult.current.loadBookmarks();
      });

      // Use navigation to go to a location using CFI
      await act(async () => {
        await navResult.current.navigateToCfi('epubcfi(/6/4[chap01]!/4/2/2[par001]/1:0)');
      });

      expect(mockRendition.display).toHaveBeenCalled();
    });
  });
});
