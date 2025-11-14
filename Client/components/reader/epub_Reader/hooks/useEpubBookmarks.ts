import { useState, useCallback } from 'react';
import {
  Bookmark as BookmarkType,
  createBookmark,
  fetchBookmarks,
  updateBookmark,
  deleteBookmark,
} from '@/lib/api';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { logger } from '@/lib/logger';

interface UseEpubBookmarksProps {
  bookId: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function useEpubBookmarks({ bookId, onSuccess, onError }: UseEpubBookmarksProps) {
  const { getAccessToken } = useAuthToken();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [isLoadingBookmarks, setIsLoadingBookmarks] = useState(true);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [currentLocationCfi, setCurrentLocationCfi] = useState<string>('');

  // Load bookmarks from API
  const loadBookmarks = useCallback(async () => {
    try {
      logger.log('useEpubBookmarks: Starting loadBookmarks for book:', bookId);
      setIsLoadingBookmarks(true);
      const accessToken = await getAccessToken();
      if (!accessToken) {
        logger.error('useEpubBookmarks: No access token available');
        throw new Error('No access token available');
      }
      logger.log('useEpubBookmarks: Fetching bookmarks from API...');
      const data = await fetchBookmarks(bookId, accessToken);
      logger.log('useEpubBookmarks: Fetched bookmarks:', { count: data.length, data });
      setBookmarks(data);
    } catch (err) {
      logger.error('useEpubBookmarks: Failed to load bookmarks:', err);
      onError?.('Failed to load bookmarks');
    } finally {
      setIsLoadingBookmarks(false);
    }
  }, [bookId, getAccessToken, onError]);

  // Check if current page is bookmarked
  const isPageBookmarked = useCallback(
    (pageNumber: number) => {
      return bookmarks.some((b) => b.pageNumber === pageNumber);
    },
    [bookmarks]
  );

  // Get bookmark for specific page
  const getPageBookmark = useCallback(
    (pageNumber: number) => {
      return bookmarks.find((b) => b.pageNumber === pageNumber);
    },
    [bookmarks]
  );

  // Toggle bookmark for current page
  const toggleBookmark = useCallback(
    async (pageNumber: number, cfi: string) => {
      const existingBookmark = getPageBookmark(pageNumber);

      if (existingBookmark) {
        // Remove bookmark
        try {
          const accessToken = await getAccessToken();
          if (!accessToken) {
            throw new Error('No access token available');
          }
          await deleteBookmark(existingBookmark.id, accessToken);
          setBookmarks((prev) => prev.filter((b) => b.id !== existingBookmark.id));
          onSuccess?.('Bookmark removed');
        } catch (err) {
          logger.error('Failed to delete bookmark:', err);
          onError?.('Failed to remove bookmark');
        }
      } else {
        // Show form to add bookmark
        setCurrentLocationCfi(cfi);
        setShowBookmarkForm(true);
      }
    },
    [getPageBookmark, getAccessToken, onSuccess, onError]
  );

  // Create new bookmark
  const createNewBookmark = useCallback(
    async (pageNumber: number, cfi: string, note: string) => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }
        const newBookmark = await createBookmark(
          {
            bookId,
            pageNumber,
            note,
          },
          accessToken
        );
        setBookmarks((prev) => [...prev, newBookmark]);
        setShowBookmarkForm(false);
        setEditingBookmark(null);
        onSuccess?.('Bookmark saved');
      } catch (err) {
        logger.error('Failed to create bookmark:', err);
        onError?.('Failed to save bookmark');
      }
    },
    [bookId, getAccessToken, onSuccess, onError]
  );

  // Update existing bookmark
  const updateExistingBookmark = useCallback(
    async (bookmarkId: string, note: string) => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }
        const updatedBookmark = await updateBookmark(bookmarkId, { note }, accessToken);
        setBookmarks((prev) =>
          prev.map((b) => (b.id === bookmarkId ? updatedBookmark : b))
        );
        setShowBookmarkForm(false);
        setEditingBookmark(null);
        onSuccess?.('Bookmark updated');
      } catch (err) {
        logger.error('Failed to update bookmark:', err);
        onError?.('Failed to update bookmark');
      }
    },
    [getAccessToken, onSuccess, onError]
  );

  // Handle bookmark form submit
  const handleBookmarkSubmit = useCallback(
    async (note: string, pageNumber: number, cfi: string) => {
      if (editingBookmark) {
        await updateExistingBookmark(editingBookmark.id, note);
      } else {
        await createNewBookmark(pageNumber, cfi, note);
      }
    },
    [editingBookmark, updateExistingBookmark, createNewBookmark]
  );

  // Handle edit bookmark
  const handleEditBookmark = useCallback((bookmark: BookmarkType) => {
    setEditingBookmark(bookmark);
    setShowBookmarkForm(true);
  }, []);

  // Handle delete bookmark
  const handleDeleteBookmark = useCallback(
    async (bookmarkId: string) => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }
        await deleteBookmark(bookmarkId, accessToken);
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        onSuccess?.('Bookmark deleted');
      } catch (err) {
        logger.error('Failed to delete bookmark:', err);
        onError?.('Failed to delete bookmark');
      }
    },
    [getAccessToken, onSuccess, onError]
  );

  // Cancel bookmark form
  const cancelBookmarkForm = useCallback(() => {
    setShowBookmarkForm(false);
    setEditingBookmark(null);
  }, []);

  return {
    // State
    bookmarks,
    editingBookmark,
    isLoadingBookmarks,
    showBookmarkForm,
    currentLocationCfi,
    
    // Setters
    setShowBookmarkForm,
    setEditingBookmark,
    setCurrentLocationCfi,
    
    // Actions
    loadBookmarks,
    isPageBookmarked,
    getPageBookmark,
    toggleBookmark,
    createNewBookmark,
    updateExistingBookmark,
    handleBookmarkSubmit,
    handleEditBookmark,
    handleDeleteBookmark,
    cancelBookmarkForm,
  };
}
