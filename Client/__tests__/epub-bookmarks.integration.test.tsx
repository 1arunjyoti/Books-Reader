/**
 * Integration tests for EPUB Reader Hooks
 * Tests the integration of various EPUB reader hooks working together
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import '@testing-library/jest-dom';
import * as api from '@/lib/api';
import { useEpubBookmarks } from '@/components/reader/epub_Reader/hooks/useEpubBookmarks';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/lib/highlights-api');
jest.mock('@/contexts/AuthTokenContext', () => ({
  useAuthToken: () => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Test wrapper with providers
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

describe('EPUB Reader Bookmarks Integration Tests', () => {
  const mockBookId = 'test-book-123';
  const mockAccessToken = 'mock-token';

  const mockBookmarks = [
    {
      id: 'bookmark-1',
      bookId: mockBookId,
      userId: 'user-123',
      pageNumber: 10,
      note: 'Important chapter',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'bookmark-2',
      bookId: mockBookId,
      userId: 'user-123',
      pageNumber: 25,
      note: null,
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
  });

  describe('Bookmarks Loading', () => {
    it('should load bookmarks successfully', async () => {
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoadingBookmarks).toBe(true);

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
        expect(result.current.isLoadingBookmarks).toBe(false);
      });

      expect(api.fetchBookmarks).toHaveBeenCalledWith(mockBookId, mockAccessToken);
    });

    it('should handle loading errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (api.fetchBookmarks as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load bookmarks');
        expect(result.current.isLoadingBookmarks).toBe(false);
      });

      consoleError.mockRestore();
    });
  });

  describe('Bookmark Creation', () => {
    it('should create a new bookmark successfully', async () => {
      (api.createBookmark as jest.Mock).mockResolvedValue({
        id: 'new-bookmark',
        bookId: mockBookId,
        userId: 'user-123',
        pageNumber: 15,
        note: 'New bookmark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onSuccess }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await act(async () => {
        await result.current.handleBookmarkSubmit('New bookmark', 15, 'epubcfi(/6/4)');
      });

      expect(api.createBookmark).toHaveBeenCalledWith(
        {
          bookId: mockBookId,
          pageNumber: 15,
          note: 'New bookmark',
        },
        mockAccessToken
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Bookmark saved');
      });
    });

    it('should handle bookmark creation errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (api.createBookmark as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.handleBookmarkSubmit('Test bookmark', 20, 'epubcfi(/6/6)');
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to save bookmark');
      });

      consoleError.mockRestore();
    });
  });

  describe('Bookmark Updates', () => {
    it('should update a bookmark successfully', async () => {
      (api.updateBookmark as jest.Mock).mockResolvedValue({
        ...mockBookmarks[0],
        note: 'Updated note',
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onSuccess }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      await act(async () => {
        result.current.handleEditBookmark(mockBookmarks[0]);
      });

      await act(async () => {
        await result.current.handleBookmarkSubmit('Updated note', 10, 'epubcfi(/6/4)');
      });

      expect(api.updateBookmark).toHaveBeenCalledWith(
        'bookmark-1',
        { note: 'Updated note' },
        mockAccessToken
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Bookmark updated');
      });
    });
  });

  describe('Bookmark Deletion', () => {
    it('should delete a bookmark successfully', async () => {
      (api.deleteBookmark as jest.Mock).mockResolvedValue(undefined);

      const onSuccess = jest.fn();
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onSuccess }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.handleDeleteBookmark('bookmark-1');
      });

      expect(api.deleteBookmark).toHaveBeenCalledWith('bookmark-1', mockAccessToken);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith('Bookmark deleted');
        expect(result.current.bookmarks).toHaveLength(1);
        expect(result.current.bookmarks[0].id).toBe('bookmark-2');
      });
    });

    it('should handle deletion errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      
      (api.deleteBookmark as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId, onError }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await act(async () => {
        await result.current.handleDeleteBookmark('bookmark-1');
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to delete bookmark');
      });

      consoleError.mockRestore();
    });
  });

  describe('Bookmark Utilities', () => {
    it('should check if page is bookmarked', async () => {
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      expect(result.current.isPageBookmarked(10)).toBe(true);
      expect(result.current.isPageBookmarked(25)).toBe(true);
      expect(result.current.isPageBookmarked(5)).toBe(false);
      expect(result.current.isPageBookmarked(100)).toBe(false);
    });

    it('should handle bookmark form state', async () => {
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      expect(result.current.showBookmarkForm).toBe(false);

      act(() => {
        result.current.setShowBookmarkForm(true);
        result.current.setCurrentLocationCfi('epubcfi(/6/4)');
      });

      expect(result.current.showBookmarkForm).toBe(true);
      expect(result.current.currentLocationCfi).toBe('epubcfi(/6/4)');

      act(() => {
        result.current.cancelBookmarkForm();
      });

      expect(result.current.showBookmarkForm).toBe(false);
      expect(result.current.editingBookmark).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple bookmarks efficiently', async () => {
      const manyBookmarks = Array.from({ length: 50 }, (_, i) => ({
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

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(50);
        expect(result.current.isLoadingBookmarks).toBe(false);
      });

      // Test checking multiple pages quickly
      const startTime = Date.now();
      for (let i = 1; i <= 50; i++) {
        result.current.isPageBookmarked(i);
      }
      const endTime = Date.now();
      
      // Should complete in less than 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle rapid sequential operations', async () => {
      let counter = 0;
      (api.createBookmark as jest.Mock).mockImplementation((bookId, data) =>
        Promise.resolve({
          id: `bookmark-${counter++}`,
          bookId,
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await Promise.all([
          result.current.handleBookmarkSubmit('Bookmark 1', 1, 'epubcfi(/6/2)'),
          result.current.handleBookmarkSubmit('Bookmark 2', 2, 'epubcfi(/6/4)'),
          result.current.handleBookmarkSubmit('Bookmark 3', 3, 'epubcfi(/6/6)'),
          result.current.handleBookmarkSubmit('Bookmark 4', 4, 'epubcfi(/6/8)'),
          result.current.handleBookmarkSubmit('Bookmark 5', 5, 'epubcfi(/6/10)'),
        ]);
      });

      expect(api.createBookmark).toHaveBeenCalledTimes(5);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain state after reload', async () => {
      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      const initialBookmarks = result.current.bookmarks;

      // Reload
      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
        expect(result.current.bookmarks[0].id).toBe(initialBookmarks[0].id);
        expect(result.current.bookmarks[1].id).toBe(initialBookmarks[1].id);
      });
    });

    it('should update local state after creation', async () => {
      (api.createBookmark as jest.Mock).mockResolvedValue({
        id: 'new-bookmark',
        bookId: mockBookId,
        userId: 'user-123',
        pageNumber: 15,
        note: 'New bookmark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const { result } = renderHook(
        () => useEpubBookmarks({ bookId: mockBookId }),
        { wrapper: createWrapper() }
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.handleBookmarkSubmit('New bookmark', 15, 'epubcfi(/6/8)');
      });

      // Should reload bookmarks after creation
      (api.fetchBookmarks as jest.Mock).mockResolvedValue([
        ...mockBookmarks,
        {
          id: 'new-bookmark',
          bookId: mockBookId,
          userId: 'user-123',
          pageNumber: 15,
          note: 'New bookmark',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(3);
        expect(result.current.isPageBookmarked(15)).toBe(true);
      });
    });
  });
});
