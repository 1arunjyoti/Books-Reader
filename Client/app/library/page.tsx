"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, X, Trash2, CheckCircle } from 'lucide-react';
import SearchBar from '@/components/library/SearchBar';
import StatusFilter from '@/components/library/StatusFilter';
import ViewModeToggle from '@/components/library/ViewModeToggle';
import SelectionBar from '@/components/library/SelectionBar';

import { UploadDialog } from '@/components/library/upload-dialog';
import EditBookMetadata from '@/components/library/edit-book-metadata';
import AdvancedFiltersComponent from '@/components/library/advanced-filters';
import { CollectionFilter } from '@/components/library/collection-filter';
import { AddToCollectionDialog } from '@/components/library/add-to-collection-dialog';
import { UploadResult } from '@/lib/upload';
import { fetchBooks, deleteBook, updateBook, Book, SearchFilters, getCollectionBooks, getWelcomeStatus, markWelcomeShown } from '@/lib/api';
import { fetchUserProfile } from '@/lib/api/user-profile';
import { useTokenCache } from '@/hooks/useTokenCache';
import { useLibraryFilters } from '@/hooks/useLibraryFilters';
import { useLibraryState } from '@/hooks/useLibraryState';
import { useViewPreferences } from '@/hooks/useViewPreferences';

import { preloadPdfJs } from '@/lib/pdf-preloader';
import { preloadEpubJs } from '@/lib/epub-preloader';
import LibraryErrorBoundary from '@/components/library/LibraryErrorBoundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import WelcomeScreen from '@/components/library/welcome-screen';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Skeletons from '@/components/library/Skeletons';
import LibraryPagination from '@/components/library/LibraryPagination';

import VirtualizedBooks from '@/components/library/VirtualizedBooks';
import BookCard from '@/components/library/BookCard';

function LibraryPageContent() {
  // Use custom hooks for state management (reduces re-renders)
  const getAccessToken = useTokenCache();
  const filters = useLibraryFilters();
  const libraryState = useLibraryState();
  const { viewMode, setViewMode } = useViewPreferences();
  
  // URL-based pagination state (persists across refresh)
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Minimal local state
  const [books, setBooks] = useState<Book[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();
  
  // Use ref instead of state to prevent re-checks on component remount within same session
  // This is an optimization - the server maintains the permanent welcome status in database
  // On page refresh, ref resets and API is checked again (server returns persistent state)
  // Behavior:
  // - New user: API returns welcomeShown=false → shows welcome → marks as shown in DB
  // - Returning user: API returns welcomeShown=true → never shows welcome again
  // - Same session navigation: ref prevents unnecessary API calls
  const welcomeCheckedRef = useRef(false);
  
  // Add debug log for showWelcomeScreen state changes
  useEffect(() => {
    logger.log('[Welcome Screen] showWelcomeScreen state changed to:', showWelcomeScreen);
  }, [showWelcomeScreen]);
  
  // Timer refs for cleanup
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const booksPerPage = 10;
  // If library grows beyond this threshold, use virtualization to render the full list
  const virtualizationThreshold = 60;

  // Simple skeleton count (no complex resize listeners)
  const skeletonCount = viewMode === 'grid' ? 5 : 3;

  // Preload PDF.js and EPUB.js libraries when library page mounts
  // This ensures readers are ready when user clicks on a book, reducing load time by ~200-400ms
  useEffect(() => {
    preloadPdfJs().catch(err => console.warn('PDF.js preload failed:', err));
    preloadEpubJs().catch(err => console.warn('EPUB.js preload failed:', err));
  }, []);

  // Check for URL parameter to force show welcome screen
  // Use a ref to track if we've already processed the welcome parameter
  const welcomeParamProcessed = useRef(false);
  
  useEffect(() => {
    const welcomeParam = searchParams.get('welcome');
    if (welcomeParam === 'true' && !welcomeParamProcessed.current) {
      welcomeParamProcessed.current = true;
      setShowWelcomeScreen(true);
      // Remove the parameter from URL after reading it
      const params = new URLSearchParams(searchParams.toString());
      params.delete('welcome');
      router.replace(`/library?${params.toString()}`);
    }
  }, [searchParams, router]);

  // Check welcome screen status on mount
  // Only shows welcome to NEW users on their FIRST visit to library
  // After closing, welcome status is permanently saved in database
  const checkWelcomeStatusFunc = useCallback(async () => {
    // Don't check if we've already checked in this session (optimization)
    if (welcomeCheckedRef.current) {
      logger.log('[Welcome Screen] Welcome status already checked in this session, skipping...');
      return;
    }
    
    // Check localStorage first for instant result
    if (typeof window !== 'undefined') {
      const localWelcomeShown = localStorage.getItem('welcomeShown');
      logger.log('[Welcome Screen] localStorage welcomeShown:', localWelcomeShown);
      
      if (localWelcomeShown === 'true') {
        logger.log('[Welcome Screen] localStorage shows welcome already seen, skipping welcome');
        welcomeCheckedRef.current = true;
        return; // Don't show welcome if localStorage says it's been shown
      }
    }
    
    try {
      logger.log('[Welcome Screen] Starting welcome status check...');
      const token = await getAccessToken();
      if (!token) {
        logger.log('[Welcome Screen] No access token available for welcome screen check');
        welcomeCheckedRef.current = true;
        return;
      }
      logger.log('[Welcome Screen] Access token obtained');

      // Fetch user profile to get the user's name
      // Note: userId is not actually used by the API - it uses the JWT token
      try {
        logger.log('[Welcome Screen] Fetching user profile...');
        const userProfile = await fetchUserProfile('user', token, ['name']);
        logger.log('[Welcome Screen] User profile fetched:', userProfile);
        if (userProfile?.name) {
          setUserName(userProfile.name);
          logger.log('[Welcome Screen] User name set:', userProfile.name);
        }
      } catch (profileError) {
        logger.warn('[Welcome Screen] Failed to fetch user profile:', profileError);
        // Continue even if profile fetch fails
      }

      // Check welcome screen status
      try {
        logger.log('[Welcome Screen] Checking welcome status...');
        const welcomeShown = await getWelcomeStatus(token);
        logger.log('[Welcome Screen] Welcome status received:', welcomeShown);
        
        // Mark that we've completed the check
        welcomeCheckedRef.current = true;
        
        // If welcome hasn't been shown, display it
        if (!welcomeShown) {
          logger.log('[Welcome Screen] Showing welcome screen (welcomeShown is false)');
          setShowWelcomeScreen(true);
        } else {
          logger.log('[Welcome Screen] Not showing welcome screen (welcomeShown is true)');
        }
      } catch (welcomeError) {
        logger.warn('[Welcome Screen] Failed to check welcome status:', welcomeError);
        welcomeCheckedRef.current = true;
        // Don't show welcome screen if we can't verify status
      }
    } catch (error) {
      logger.error('[Welcome Screen] Error in welcome screen initialization:', error);
      welcomeCheckedRef.current = true;
    }
  }, [getAccessToken]);

  useEffect(() => {
    checkWelcomeStatusFunc();
  }, [checkWelcomeStatusFunc]);

  // Handle closing welcome screen
  // Permanently marks welcome as shown in database - user will never see it again
  const handleCloseWelcome = useCallback(async () => {
    logger.log('[Welcome Screen] Closing welcome screen...');
    setShowWelcomeScreen(false);
    welcomeCheckedRef.current = true; // Mark as checked in this session
    
    try {
      const token = await getAccessToken();
      if (token) {
        logger.log('[Welcome Screen] Got access token, calling markWelcomeShown...');
        // Permanently save to database that user has seen welcome
        await markWelcomeShown(token);
        logger.log('[Welcome Screen] Successfully marked welcome as shown in database');
      } else {
        logger.warn('[Welcome Screen] No access token available to mark welcome as shown');
      }
    } catch (error) {
      logger.error('[Welcome Screen] Error marking welcome shown:', error);
      // Don't throw - welcome screen is already closed, localStorage should have saved it
    }
  }, [getAccessToken]);

  // Use react-query to fetch and cache books with background revalidation.
  // React Query's built-in garbage collection (gcTime: 10 minutes) handles cache cleanup automatically.
  // No need for manual cleanup - the QueryClient is configured in QueryProvider with:
  // - staleTime: 5 minutes (data freshness)
  // - gcTime: 10 minutes (cache retention before automatic cleanup)
  const queryClient = useQueryClient();
  
  // Memoize query key to prevent recreation on every render
  // Use stable array strings to avoid cache misses
  const genreKey = useMemo(
    () => filters.advancedFilters.genre?.sort().join(',') || '',
    [filters.advancedFilters.genre]
  );
  
  const formatKey = useMemo(
    () => filters.advancedFilters.format?.sort().join(',') || '',
    [filters.advancedFilters.format]
  );

  const booksQueryKey = useMemo(() => [
    'books',
    selectedCollectionId,
    filters.advancedFilters.search,
    filters.advancedFilters.status,
    genreKey,
    formatKey,
    filters.advancedFilters.language,
    filters.advancedFilters.dateFrom,
    filters.advancedFilters.dateTo,
    filters.advancedFilters.sortBy,
    filters.advancedFilters.sortOrder,
  ], [
    selectedCollectionId,
    filters.advancedFilters.search,
    filters.advancedFilters.status,
    genreKey,
    formatKey,
    filters.advancedFilters.language,
    filters.advancedFilters.dateFrom,
    filters.advancedFilters.dateTo,
    filters.advancedFilters.sortBy,
    filters.advancedFilters.sortOrder,
  ]);

  const { data: fetchedBooks, isLoading, error: fetchError } = useQuery<Book[], Error>({
    queryKey: booksQueryKey,
    queryFn: async () => {
      // 1. Check if offline first
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        console.log('App is offline, loading from local storage');
        const { offlineStorage } = await import('@/lib/offline-storage');
        const offlineBooks = await offlineStorage.getAllOfflineBooks();
        return offlineBooks.map(ob => ob.book);
      }

      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Please sign in to view your library');

        if (selectedCollectionId) {
          const collectionData = await getCollectionBooks(selectedCollectionId, token);
          return collectionData.books || [];
        }

        const filterParams: SearchFilters = {
          search: filters.advancedFilters.search,
          status: filters.advancedFilters.status,
          genre: filters.advancedFilters.genre,
          language: filters.advancedFilters.language,
          format: filters.advancedFilters.format,
          dateFrom: filters.advancedFilters.dateFrom,
          dateTo: filters.advancedFilters.dateTo,
          sortBy: filters.advancedFilters.sortBy,
          sortOrder: filters.advancedFilters.sortOrder,
        };

        const fetched = await fetchBooks(token, filterParams);
        return fetched || [];
      } catch (error) {
        console.error('Error fetching books:', error);
        
        // Fallback to offline storage on error
        if (typeof window !== 'undefined') {
          console.log('Fetch failed, falling back to offline storage');
          const { offlineStorage } = await import('@/lib/offline-storage');
          const offlineBooks = await offlineStorage.getAllOfflineBooks();
          if (offlineBooks.length > 0) {
            return offlineBooks.map(ob => ob.book);
          }
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: false, // Don't retry if we're going to fallback to offline anyway
  });

  // keep local books state for compatibility with selection and optimistic updates
  useEffect(() => {
    if (fetchedBooks && Array.isArray(fetchedBooks)) {
      setBooks(fetchedBooks as Book[]);
      // Removed fallback welcome check - it was causing welcome to reappear after dismissal
      // The initial mount check is sufficient
    }
  }, [fetchedBooks]);

  useEffect(() => {
    if (fetchError) setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
    else setError(null);
  }, [fetchError]);

  /* Load books (trigger a refetch via react-query) */
  const loadBooks = useCallback(async () => {
    // Invalidate specific query instead of all 'books' queries
    await queryClient.invalidateQueries({ queryKey: booksQueryKey, exact: true });
  }, [queryClient, booksQueryKey]);

  /* Handle book selection for bulk operations */
  const handleToggleBookSelection = useCallback((bookId: string) => {
    libraryState.toggleBookSelection(bookId);
  }, [libraryState]);
  
  /* Handle collection change */
  const handleCollectionChange = useCallback(() => {
    loadBooks();
    libraryState.clearSelection();
  }, [loadBooks, libraryState]);

  /* Handle upload success */
  const handleUploadComplete = (results: UploadResult[]) => {
    setUploadSuccess(`Successfully uploaded ${results.length} file${results.length > 1 ? 's' : ''}`);
    setUploadError(null);
    
    // Clear existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    // Clear success message after 5 seconds
    successTimeoutRef.current = setTimeout(() => {
      setUploadSuccess(null);
      successTimeoutRef.current = null;
    }, 5000);
    
    // Refresh books list from server
    loadBooks();
  };

  /* Handle upload error */
  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess(null);
    
    // Clear existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Clear error message after 5 seconds
    errorTimeoutRef.current = setTimeout(() => {
      setUploadError(null);
      errorTimeoutRef.current = null;
    }, 5000);
  };

  /* Handle delete book */
  const handleDeleteBook = useCallback(async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      libraryState.setBookToDelete(book);
      libraryState.setDeleteDialogOpen(true);
    }
  }, [books, libraryState]);

  /* Confirm delete book */
  const confirmDeleteBook = useCallback(async () => {
    if (!libraryState.bookToDelete) return;

    try {
      libraryState.setIsDeleting(true);
      const token = await getAccessToken();
      if (!token) {
        setUploadError('Please sign in to delete books');
        return;
      }

      await deleteBook(libraryState.bookToDelete.id, token);
      
      // Close dialog and reset state
      libraryState.setDeleteDialogOpen(false);
      libraryState.setBookToDelete(null);
      
      // Refresh books list
      loadBooks();
      setUploadSuccess('Book deleted successfully');
      
      // Clear existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        setUploadSuccess(null);
        successTimeoutRef.current = null;
      }, 5000);
    } catch (err) {
      console.error('Error deleting book:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to delete book');
      
      // Clear existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setUploadError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    } finally {
      libraryState.setIsDeleting(false);
    }
  }, [libraryState, getAccessToken, loadBooks]);

  /* Update book status - Memoized to prevent re-renders */
  const handleUpdateStatus = useCallback(async (bookId: string, newStatus: string) => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setUploadError('Please sign in to update books');
        return;
      }

      await updateBook(bookId, { status: newStatus }, token);
      
      // Specific invalidation instead of all books
      queryClient.invalidateQueries({ queryKey: booksQueryKey, exact: true });
    } catch (err) {
      console.error('Error updating book:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to update book');
      
      // Clear existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setUploadError(null);
        errorTimeoutRef.current = null;
      }, 5000);
    }
  }, [getAccessToken, queryClient, booksQueryKey]);



  // Calculate pagination - now based on all books from server
  const totalBooks = books.length;
  const totalPages = Math.ceil(totalBooks / booksPerPage);
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);

  /* Select all visible books */
  const handleSelectAllBooks = () => {
    if (libraryState.selectedBookIds.size === currentBooks.length) {
      libraryState.clearSelection();
    } else {
      libraryState.selectAllBooks(currentBooks.map(book => book.id));
    }
  };

  /* Preload appropriate reader library based on book file type */
  const preloadReaderForBook = useCallback((book: Book) => {
    const fileType = book.fileType?.toLowerCase() || '';
    
    if (fileType === 'epub') {
      preloadEpubJs().catch(err => console.warn('EPUB.js preload failed:', err));
    } else if (fileType === 'pdf') {
      preloadPdfJs().catch(err => console.warn('PDF.js preload failed:', err));
    }
    // TXT files don't need preloading as TxtViewer has no heavy dependencies
  }, []);

  // Helper to update page in URL
  const updatePage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page'); // Clean URL for page 1
    } else {
      params.set('page', page.toString());
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Change page (updates URL)
  const paginate = useCallback((pageNumber: number) => {
    updatePage(pageNumber);
  }, [updatePage]);
  
  const nextPage = useCallback(() => {
    const newPage = Math.min(currentPage + 1, totalPages);
    updatePage(newPage);
  }, [currentPage, totalPages, updatePage]);
  
  const prevPage = useCallback(() => {
    const newPage = Math.max(currentPage - 1, 1);
    updatePage(newPage);
  }, [currentPage, updatePage]);

  // Reset to first page when filters change (but not on every render)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      updatePage(1);
    }
  }, [totalPages, currentPage, updatePage]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 pt-20 md:pt-24 max-w-7xl">
      {/* Welcome Screen */}
      {showWelcomeScreen && (
        <WelcomeScreen 
          onClose={handleCloseWelcome}
          userName={userName}
        />
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-4 p-4 sm:p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">My Library</h1>
  {isLoading ? (
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg md:text-xl">
            Loading your books...
          </p>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg md:text-xl">
            {books.length} {books.length === 1 ? 'book' : 'books'} found • 
            Page {currentPage} of {totalPages || 1} • 
            Showing {indexOfFirstBook + 1}-{Math.min(indexOfLastBook, books.length)} of {books.length}
          </p>
        )}
      </div>
      
      {/* Toast Notifications - Fixed Position */}
      {(uploadSuccess || uploadError || (error && !uploadError)) && (
        <div className="fixed top-4 right-4 z-50 max-w-md w-full sm:w-auto animate-in slide-in-from-top-5">
          {uploadSuccess && (
            <div className="mb-2 p-4 bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-800 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200 flex-1">
                  {uploadSuccess}
                </p>
                <button
                  onClick={() => setUploadSuccess(null)}
                  className="p-2 hover:bg-green-100 dark:hover:bg-green-800 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-green-600 dark:text-green-400" />
                </button>
              </div>
            </div>
          )}
          {uploadError && (
            <div className="mb-2 p-4 bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 flex-1">
                  {uploadError}
                </p>
                <button
                  onClick={() => setUploadError(null)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          )}
          {error && !uploadError && (
            <div className="mb-2 p-4 bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200 flex-1">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-full"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className=" top-0 z-50 bg-gray-50 dark:bg-gray-800/50 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm mb-6 rounded-xl">
        <div className="container mx-auto px-2 py-2">
          {/* Main Filter Row */}
          <div className="flex flex-col md:flex-col lg:flex-row gap-2 md:gap-4">
            {/* Search Bar */}
            <SearchBar
              value={filters.searchQuery}
              onChange={(e) => filters.setSearchQuery(e.target.value)}
            />

            {/* Upload Button */}
            <UploadDialog
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
            
            {/* Filter Group - Organized in sections */}
            <div className="flex flex-wrap md:flex-nowrap lg:flex-nowrap items-center gap-2">
              
              {/* Primary Filters */}
              <div className="flex w-full justify-between items-center gap-2 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 h-12">
                {/* Status Filter */}
                <StatusFilter value={filters.statusFilter} onChange={filters.setStatusFilter} />

                {/* Collection Filter */}
                <CollectionFilter
                  selectedCollectionId={selectedCollectionId}
                  onCollectionChange={setSelectedCollectionId}
                />
                
                
              </div>
              
            </div>
            {/* Secondary Actions */}
            <div className="flex justify-end items-center gap-2">
              <ViewModeToggle viewMode={viewMode} setViewMode={(m) => setViewMode(m)} />
              
              {/* Advanced Filters */}
                <AdvancedFiltersComponent
                  filters={filters.advancedFilters}
                  onFiltersChange={filters.handleFiltersChange}
                  onReset={filters.resetFilters}
                />
            </div>

          </div>
        </div>
      </div>
      
      {/* Selection Bar - Shows when books are selected */}
      {libraryState.selectedBookIds.size > 0 && (
        <SelectionBar
          selectedCount={libraryState.selectedBookIds.size}
          allSelected={libraryState.selectedBookIds.size === currentBooks.length}
          onToggleSelectAll={handleSelectAllBooks}
          onAddToCollection={() => setShowAddToCollection(true)}
          onClearSelection={libraryState.clearSelection}
        />
      )}

      {/* Books Grid/List (skeletons shown while loading) */}
      {isLoading ? (
        <Skeletons viewMode={viewMode} skeletonCount={skeletonCount} />
      ) : books.length > virtualizationThreshold ? (
        <VirtualizedBooks
          books={books}
          viewMode={viewMode}
          selectedBookIds={libraryState.selectedBookIds}
          onToggleBookSelection={handleToggleBookSelection}
          setEditingBook={libraryState.setEditingBook}
          handleUpdateStatus={handleUpdateStatus}
          handleDeleteBook={handleDeleteBook}
          overscan={4}
        />
      ) : books.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? "grid items-stretch grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-6"
            : "flex flex-col gap-3"
        }>
          {currentBooks.map((book, index) => {
            // Prioritize first row images for faster LCP
            const isAboveFold = index < 5; // First 5 books in grid view
            
            return (
              <BookCard
                key={book.id}
                book={book}
                viewMode={viewMode}
                isSelected={libraryState.selectedBookIds.has(book.id)}
                onToggleSelection={handleToggleBookSelection}
                onPreload={preloadReaderForBook}
                priority={isAboveFold}
                onEdit={libraryState.setEditingBook}
                onDelete={handleDeleteBook}
                onUpdateStatus={handleUpdateStatus}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No books found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Try adjusting your filters or upload some new books to your library.
          </p>
        </div>
      )}

      {/* Edit Book Metadata Dialog */}
      {libraryState.editingBook && (
        <EditBookMetadata
          book={libraryState.editingBook}
          onClose={() => libraryState.setEditingBook(null)}
          onSave={async (updatedBook) => {
            try {
              // STEP 1: Update the book in the local state optimistically
              setBooks(prevBooks => prevBooks.map(b => b.id === updatedBook.id ? { ...b, ...updatedBook } : b));
              
              // STEP 2: Show success feedback immediately
              setUploadSuccess('Book metadata updated successfully');
              
              // STEP 3: Refresh from server in background to ensure data consistency
              await loadBooks();
              
              // STEP 4: Clear success message after timeout
              if (successTimeoutRef.current) {
                clearTimeout(successTimeoutRef.current);
              }
              successTimeoutRef.current = setTimeout(() => {
                setUploadSuccess(null);
                successTimeoutRef.current = null;
              }, 5000);
            } catch (error) {
              console.error('Error saving book metadata:', error);
              // If refresh fails, we still have the local update
              // Show error but don't lose the optimistic update
              setUploadError('Failed to sync changes with server');
              
              if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
              }
              errorTimeoutRef.current = setTimeout(() => {
                setUploadError(null);
                errorTimeoutRef.current = null;
              }, 5000);
            }
          }}
        />
      )}

      {/* Pagination (hidden when using virtualization for large libraries) */}
      {books.length <= virtualizationThreshold && (
        <LibraryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => paginate(p)}
          onPrev={prevPage}
          onNext={nextPage}
        />
      )}
      
      {/* Add to Collection Dialog */}
      <AddToCollectionDialog
        open={showAddToCollection}
        onOpenChange={setShowAddToCollection}
        bookIds={Array.from(libraryState.selectedBookIds)}
        onSuccess={handleCollectionChange}
      />
      
      {/* Delete Book Confirmation Dialog */}
      <AlertDialog open={libraryState.deleteDialogOpen} onOpenChange={libraryState.setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Book
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">&quot;{libraryState.bookToDelete?.title}&quot;</span>
              {libraryState.bookToDelete?.author && <span> by {libraryState.bookToDelete.author}</span>}?
              <br />
              <br />
              This action cannot be undone. The book file will be permanently deleted from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={libraryState.isDeleting}
              className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteBook}
              disabled={libraryState.isDeleting}
              className="bg-red-700 hover:bg-red-800 focus:ring-red-600 text-white"
            >
              {libraryState.isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Book
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export the library page wrapped with error boundaries
// QueryErrorResetBoundary integrates with React Query to allow error recovery
// LibraryErrorBoundary provides specialized error UI for library-specific failures
export default function LibraryPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <LibraryErrorBoundary onReset={reset}>
          <Suspense fallback={<div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading library...</div>}>
            <LibraryPageContent />
          </Suspense>
        </LibraryErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
