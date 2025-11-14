/**
 * Unit tests for useEpubBookmarks hook
 * Tests bookmark CRUD operations, API integration, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpubBookmarks } from '../useEpubBookmarks';
import * as api from '@/lib/api';

// Mock the API
jest.mock('@/lib/api');

// Mock the AuthToken context
const mockGetAccessToken = jest.fn();
jest.mock('@/contexts/AuthTokenContext', () => ({
  useAuthToken: () => ({
    getAccessToken: mockGetAccessToken,
  }),
}));

describe('useEpubBookmarks', () => {
  const mockBookId = 'book-123';
  const mockAccessToken = 'test-access-token';

  const mockBookmarks = [
    {
      id: 'bookmark-1',
      bookId: mockBookId,
      userId: 'user-123',
      cfi: 'epubcfi(/6/4)',
      pageNumber: 10,
      note: 'Test bookmark 1',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-01').toISOString(),
    },
    {
      id: 'bookmark-2',
      bookId: mockBookId,
      userId: 'user-123',
      cfi: 'epubcfi(/6/6)',
      pageNumber: 20,
      note: 'Test bookmark 2',
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-02').toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccessToken.mockResolvedValue(mockAccessToken);
  });

  describe('initialization and loading', () => {
    it('should initialize with empty bookmarks', () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      expect(result.current.bookmarks).toEqual([]);
      expect(result.current.isLoadingBookmarks).toBe(true);
    });

    it('should load bookmarks on mount via loadBookmarks call', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
        expect(result.current.isLoadingBookmarks).toBe(false);
      });

      expect(api.fetchBookmarks).toHaveBeenCalledWith(mockBookId, mockAccessToken);
    });

    it('should handle load errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const onError = jest.fn();
      (api.fetchBookmarks as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onError })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to load bookmarks');
      });

      consoleError.mockRestore();
    });

    it('should handle missing access token', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAccessToken.mockResolvedValue(null);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
      mockGetAccessToken.mockResolvedValue(mockAccessToken); // Reset for other tests
    });
  });

  describe('bookmark detection', () => {
    it('should detect if a page is bookmarked', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.isPageBookmarked(10)).toBe(true);
        expect(result.current.isPageBookmarked(20)).toBe(true);
        expect(result.current.isPageBookmarked(30)).toBe(false);
      });
    });
  });

  describe('creating bookmarks', () => {
    it('should create a new bookmark', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue([]);
      (api.createBookmark as jest.Mock).mockResolvedValue({
        id: 'new-bookmark',
        bookId: mockBookId,
        cfi: 'epubcfi(/6/8)',
        pageNumber: 30,
        note: 'New bookmark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onSuccess })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await act(async () => {
        await result.current.createNewBookmark(30, 'epubcfi(/6/8)', 'New bookmark');
      });

      expect(api.createBookmark).toHaveBeenCalledWith(
        {
          bookId: mockBookId,
          pageNumber: 30,
          note: 'New bookmark',
        },
        mockAccessToken
      );

      expect(onSuccess).toHaveBeenCalledWith('Bookmark saved');

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(1);
      });
    });

    it('should handle create errors', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue([]);
      (api.createBookmark as jest.Mock).mockRejectedValue(new Error('API error'));

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onError })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await act(async () => {
        await result.current.createNewBookmark(30, 'epubcfi(/6/8)', '');
      });

      expect(onError).toHaveBeenCalledWith('Failed to save bookmark');
    });
  });

  describe('updating bookmarks', () => {
    it('should update an existing bookmark', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
      (api.updateBookmark as jest.Mock).mockResolvedValue({
        ...mockBookmarks[0],
        note: 'Updated note',
      });

      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onSuccess })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.updateExistingBookmark('bookmark-1', 'Updated note');
      });

      expect(api.updateBookmark).toHaveBeenCalledWith(
        'bookmark-1',
        { note: 'Updated note' },
        mockAccessToken
      );

      expect(onSuccess).toHaveBeenCalledWith('Bookmark updated');

      await waitFor(() => {
        const bookmark = result.current.bookmarks.find((b) => b.id === 'bookmark-1');
        expect(bookmark?.note).toBe('Updated note');
      });
    });

    it('should handle update errors', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
      (api.updateBookmark as jest.Mock).mockRejectedValue(new Error('API error'));

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onError })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.updateExistingBookmark('bookmark-1', 'Updated note');
      });

      expect(onError).toHaveBeenCalledWith('Failed to update bookmark');
    });
  });

  describe('deleting bookmarks', () => {
    it('should delete a bookmark', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
      (api.deleteBookmark as jest.Mock).mockResolvedValue(undefined);

      const onSuccess = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onSuccess })
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
      expect(onSuccess).toHaveBeenCalledWith('Bookmark deleted');

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(1);
      });
    });

    it('should handle delete errors', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
      (api.deleteBookmark as jest.Mock).mockRejectedValue(new Error('API error'));

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId, onError })
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

      expect(onError).toHaveBeenCalledWith('Failed to delete bookmark');

      // Bookmarks should remain unchanged
      expect(result.current.bookmarks).toHaveLength(2);
    });
  });

  describe('toggle bookmark', () => {
    it('should show form when toggling on unbookmarked page', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await act(async () => {
        await result.current.toggleBookmark(30, 'epubcfi(/6/8)');
      });

      expect(result.current.showBookmarkForm).toBe(true);
      expect(result.current.currentLocationCfi).toBe('epubcfi(/6/8)');
    });

    it('should delete bookmark when page is already bookmarked', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);
      (api.deleteBookmark as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.isPageBookmarked(10)).toBe(true);
      });

      await act(async () => {
        await result.current.toggleBookmark(10, 'epubcfi(/6/4)');
      });

      expect(api.deleteBookmark).toHaveBeenCalledWith('bookmark-1', mockAccessToken);
    });
  });

  describe('bookmark form management', () => {
    it('should show/hide bookmark form', () => {
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      act(() => {
        result.current.setShowBookmarkForm(true);
      });

      expect(result.current.showBookmarkForm).toBe(true);

      act(() => {
        result.current.setShowBookmarkForm(false);
      });

      expect(result.current.showBookmarkForm).toBe(false);
    });

    it('should open bookmark form for editing', async () => {
      (api.fetchBookmarks as jest.Mock).mockResolvedValue(mockBookmarks);

      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      await act(async () => {
        await result.current.loadBookmarks();
      });

      await waitFor(() => {
        expect(result.current.bookmarks).toHaveLength(2);
      });

      act(() => {
        result.current.handleEditBookmark(mockBookmarks[0]);
      });

      expect(result.current.showBookmarkForm).toBe(true);
      expect(result.current.editingBookmark).toEqual(mockBookmarks[0]);
    });

    it('should cancel bookmark form', () => {
      const { result } = renderHook(() =>
        useEpubBookmarks({ bookId: mockBookId })
      );

      act(() => {
        result.current.setShowBookmarkForm(true);
      });

      expect(result.current.showBookmarkForm).toBe(true);

      act(() => {
        result.current.cancelBookmarkForm();
      });

      expect(result.current.showBookmarkForm).toBe(false);
      expect(result.current.editingBookmark).toBeNull();
    });
  });
});
