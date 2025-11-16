"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, Bookmark, CheckCircle, X, XCircle, Trash2 } from 'lucide-react';
import SearchBar from '@/components/library/SearchBar';
import StatusFilter from '@/components/library/StatusFilter';
import ViewModeToggle from '@/components/library/ViewModeToggle';
import SelectionBar from '@/components/library/SelectionBar';
import ActionMenu from '@/components/library/ActionMenu';
import Image from 'next/image';
import Link from 'next/link';
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
import { sanitizeText, sanitizeArray } from '@/lib/sanitize';
import { preloadPdfJs } from '@/lib/pdf-preloader';
import { preloadEpubJs } from '@/lib/epub-preloader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import WelcomeScreen from '@/components/library/welcome-screen';
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
import { Checkbox } from '@/components/ui/checkbox';
import VirtualizedBooks from '@/components/library/VirtualizedBooks';

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
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  
  // Add debug log for showWelcomeScreen state changes
  useEffect(() => {
    console.log('[Welcome Screen] showWelcomeScreen state changed to:', showWelcomeScreen);
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
  const checkWelcomeStatusFunc = useCallback(async () => {
    // Don't check if we've already checked or if welcome screen was manually dismissed
    if (welcomeChecked) {
      console.log('[Welcome Screen] Welcome status already checked, skipping...');
      return;
    }
    
    try {
      console.log('[Welcome Screen] Starting welcome status check...');
      const token = await getAccessToken();
      if (!token) {
        console.log('[Welcome Screen] No access token available for welcome screen check');
        setWelcomeChecked(true);
        return;
      }
      console.log('[Welcome Screen] Access token obtained');

      // Fetch user profile to get the user's name
      // Note: userId is not actually used by the API - it uses the JWT token
      try {
        console.log('[Welcome Screen] Fetching user profile...');
        const userProfile = await fetchUserProfile('user', token, ['name']);
        console.log('[Welcome Screen] User profile fetched:', userProfile);
        if (userProfile?.name) {
          setUserName(userProfile.name);
          console.log('[Welcome Screen] User name set:', userProfile.name);
        }
      } catch (profileError) {
        console.warn('[Welcome Screen] Failed to fetch user profile:', profileError);
        // Continue even if profile fetch fails
      }

      // Check welcome screen status
      try {
        console.log('[Welcome Screen] Checking welcome status...');
        const welcomeShown = await getWelcomeStatus(token);
        console.log('[Welcome Screen] Welcome status received:', welcomeShown);
        
        // Mark that we've completed the check
        setWelcomeChecked(true);
        
        // If welcome hasn't been shown, display it
        if (!welcomeShown) {
          console.log('[Welcome Screen] Showing welcome screen (welcomeShown is false)');
          setShowWelcomeScreen(true);
        } else {
          console.log('[Welcome Screen] Not showing welcome screen (welcomeShown is true)');
        }
      } catch (welcomeError) {
        console.warn('[Welcome Screen] Failed to check welcome status:', welcomeError);
        setWelcomeChecked(true);
        // Don't show welcome screen if we can't verify status
      }
    } catch (error) {
      console.error('[Welcome Screen] Error in welcome screen initialization:', error);
      setWelcomeChecked(true);
    }
  }, [getAccessToken, welcomeChecked]);

  useEffect(() => {
    checkWelcomeStatusFunc();
  }, [checkWelcomeStatusFunc]);

  // Handle closing welcome screen
  const handleCloseWelcome = useCallback(async () => {
    setShowWelcomeScreen(false);
    setWelcomeChecked(true); // Mark as checked so it doesn't reappear
    
    try {
      const token = await getAccessToken();
      if (token) {
        await markWelcomeShown(token);
        console.log('[Welcome Screen] Successfully marked welcome as shown');
      } else {
        console.warn('No access token available to mark welcome as shown');
      }
    } catch (error) {
      console.error('Error marking welcome shown:', error);
      // Don't throw - welcome screen is already closed
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
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in to view your library');

      if (selectedCollectionId) {
        const collectionData = await getCollectionBooks(selectedCollectionId, token);
        // Backend handles filtering - no client-side filter needed
        return collectionData.books;
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

      // Backend handles all filtering - no client-side filter needed
      const fetched = await fetchBooks(token, filterParams);
      return fetched;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
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

  // Get icon for book status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reading':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'want-to-read':
        return <Bookmark className="w-4 h-4 text-yellow-500" />;
      case 'read':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unread':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get label for book status
  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

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

  /* Normalize cover URL - ensure it starts with / or is absolute */
  const normalizeCoverUrl = (coverUrl: string | null | undefined): string => {
    if (!coverUrl) return '/books-cover.jpg';
    
    // If already absolute URL, return as is
    if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
      return coverUrl;
    }
    
    // If already starts with /, return as is
    if (coverUrl.startsWith('/')) {
      return coverUrl;
    }
    
    // Otherwise, prepend / to make it absolute
    return `/${coverUrl}`;
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
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-4 max-w-7xl">
      {/* Welcome Screen */}
      {showWelcomeScreen && (
        <WelcomeScreen 
          onClose={handleCloseWelcome}
          userName={userName}
        />
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-4 p-4 sm:p-6 md:p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-sm">
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
                  className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded"
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
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
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
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
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
      <div className="md:sticky top-0 z-50 bg-gradient-to-b from-white via-white to-white/95 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 shadow-sm mb-6 rounded-sm">
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
              <div className="flex w-full justify-between items-center gap-2 p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 h-12">
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
            ? "grid items-stretch grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6"
            : "flex flex-col gap-3"
        }>
          {currentBooks.map((book, index) => {
            // Prioritize first row images for faster LCP
            const isAboveFold = index < 5; // First 5 books in grid view
            
            return viewMode === 'grid' ? (
              // Grid View
              <div 
                key={book.id} 
                className="h-full flex flex-col group relative bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:-translate-y-1"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none" />
                
                {/* Selection Checkbox */}
                <div className={`absolute top-3 left-3 z-20 transition-all duration-200 ${
                  libraryState.selectedBookIds.has(book.id) 
                    ? 'opacity-100 scale-100' 
                    : 'lg:opacity-0 lg:scale-75 group-hover:opacity-100 group-hover:scale-100'
                }`}>
                  <Checkbox
                    checked={libraryState.selectedBookIds.has(book.id)}
                    onCheckedChange={() => handleToggleBookSelection(book.id)}
                    className="bg-white dark:bg-white backdrop-blur-sm"
                  />
                </div>
                
                <Link 
                  href={`/library/read/${book.id}`} 
                  className="block relative"
                  prefetch={true}
                  onMouseEnter={() => preloadReaderForBook(book)}
                  onTouchStart={() => preloadReaderForBook(book)}
                >
                  <div className="aspect-[2/3] flex-none bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden cursor-pointer">
                    <Image
                      src={normalizeCoverUrl(book.coverUrl)}
                      alt={`${book.title} cover`}
                      width={180}
                      height={270}
                      quality={75}
                      loading={isAboveFold ? 'eager' : 'lazy'}
                      priority={isAboveFold}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='2' height='3' fill='%23e5e7eb'/%3E%3C/svg%3E"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 20vw, 180px"
                      className="object-cover w-full h-full"
                    />
                    
                    {/* Enhanced overlay effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-all duration-300" />
                    
                    {/* Shine effect on hover (no sliding) */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-transparent group-hover:via-white/10 transition-opacity duration-300 opacity-0 group-hover:opacity-10 pointer-events-none" />
                    
                    {/* Status Text - Bottom Right with Color-coded Text */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className={`text-xs font-bold drop-shadow-lg ${
                        book.status === 'reading' 
                          ? 'text-blue-400' 
                          : book.status === 'read'
                          ? 'text-green-400'
                          : book.status === 'want-to-read'
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}>
                        {getStatusLabel(book.status)}
                      </span>
                    </div>
                    
                    {/* Progress indicator */}
                    {book.progress > 0 && (
                      <>
                        {/* Progress bar at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 backdrop-blur-sm">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 transition-all duration-500 shadow-lg"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                        
                        {/* Progress percentage badge */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-bold shadow-lg ring-1 ring-white/20">
                          {book.progress}%
                        </div>
                      </>
                    )}
                  </div>
                </Link>
                
                <ActionMenu
                  book={book}
                  setEditingBook={libraryState.setEditingBook}
                  handleUpdateStatus={handleUpdateStatus}
                  handleDeleteBook={handleDeleteBook}
                />
                
                {/* Book Details */}
                <div className="relative p-3 sm:p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex-1 flex flex-col">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sanitizeText(book.title, 500)}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate font-medium mb-2">
                    {sanitizeText(book.author || 'Unknown Author', 200)}
                    {book.publicationYear && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">• {book.publicationYear}</span>
                    )}
                  </p>
                  {book.genre && book.genre.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {sanitizeArray(book.genre, 20, 50).slice(0, 2).map((g) => (
                        <span 
                          key={g} 
                          className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 font-medium ring-1 ring-blue-600/20 dark:ring-blue-400/20 shadow-sm"
                        >
                          {g}
                        </span>
                      ))}
                      {book.genre.length > 2 && (
                        <span
                          key="more"
                          className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 text-blue-700 dark:text-blue-300 font-medium ring-1 ring-blue-600/20 dark:ring-blue-400/20 shadow-sm"
                          title={"More genres: " + sanitizeArray(book.genre, 20, 50).slice(2).join(', ')}
                        >
                          ...
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </div>
            ) : (
              // List View
              <div 
                key={book.id}
                className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-700"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-blue-500/3 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
                
                <div className="relative flex gap-3 p-3 lg:p-4 items-start">
                  {/* Selection Checkbox */}
                  <div className={`self-start transition-all duration-200 ${
                    libraryState.selectedBookIds.has(book.id) 
                      ? 'opacity-100 scale-100' 
                      : 'lg:opacity-0 lg:scale-75 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    <Checkbox
                      checked={libraryState.selectedBookIds.has(book.id)}
                      onCheckedChange={() => handleToggleBookSelection(book.id)}
                      className="bg-white dark:bg-white backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* Book Cover */}
                  <Link 
                    href={`/library/read/${book.id}`} 
                    className="flex-shrink-0 group/cover"
                    prefetch={true}
                    onMouseEnter={() => preloadReaderForBook(book)}
                    onTouchStart={() => preloadReaderForBook(book)}
                  >
                    <div className="w-28 h-40 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 relative overflow-hidden rounded-lg shadow-lg ring-1 ring-gray-900/5 dark:ring-white/10 cursor-pointer transform transition-all duration-300 group-hover/cover:scale-105 group-hover/cover:shadow-2xl group-hover/cover:ring-2 group-hover/cover:ring-blue-500/50">
                      <Image
                        src={normalizeCoverUrl(book.coverUrl)}
                        alt={`${book.title} cover`}
                        width={112}
                        height={160}
                        quality={70}
                        loading={isAboveFold ? 'eager' : 'lazy'}
                        priority={isAboveFold}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1.5 2'%3E%3Crect width='1.5' height='2' fill='%23d1d5db'/%3E%3C/svg%3E"
                        sizes="112px"
                        className="object-cover w-full h-full"
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Progress indicator on cover */}
                      {book.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0">
                          <div className="h-1.5 bg-gray-900/20 backdrop-blur-sm">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  {/* Book Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <Link 
                        href={`/library/read/${book.id}`}
                        prefetch={true}
                        onMouseEnter={() => preloadReaderForBook(book)}
                        onTouchStart={() => preloadReaderForBook(book)}
                      >
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-tight mb-1 line-clamp-2">
                          {sanitizeText(book.title, 500)}
                        </h3>
                      </Link>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        by {sanitizeText(book.author || 'Unknown Author', 200)}
                        {book.publicationYear && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">• {book.publicationYear}</span>
                        )}
                      </p>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          book.status === 'reading' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-600/20' 
                            : book.status === 'read'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-1 ring-green-600/20'
                            : book.status === 'want-to-read'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 ring-1 ring-yellow-600/20'
                            : 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400 ring-1 ring-gray-600/20'
                        }`}>
                          {getStatusIcon(book.status)}
                          <span>{getStatusLabel(book.status)}</span>
                        </div>
                        
                        {/* Genre tags */}
                        {book.genre && book.genre.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {sanitizeArray(book.genre, 20, 50).slice(0, 5).map((g) => (
                                      <span 
                                        key={g} 
                                        className="inline-block text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 font-medium ring-1 ring-purple-600/10 dark:ring-purple-400/10"
                                      >
                                        {g}
                                      </span>
                                    ))}
                                    {book.genre.length > 5 && (
                                      <span
                                        key="more-list"
                                        className="inline-block text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 font-medium ring-1 ring-purple-600/10 dark:ring-purple-400/10"
                                        title={"More genres: " + book.genre.slice(2).join(', ')}
                                      >
                                        ...
                                      </span>
                                    )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {book.progress > 0 && (
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reading Progress</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{book.progress}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 rounded-full transition-all duration-500 shadow-sm"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Menu */}
                  <ActionMenu
                    book={book}
                    setEditingBook={libraryState.setEditingBook}
                    handleUpdateStatus={handleUpdateStatus}
                    handleDeleteBook={handleDeleteBook}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-10 md:py-12 px-4">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-gray-300 dark:text-gray-600 mb-3 sm:mb-4">
            <BookOpen className="w-full h-full" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">No books found</h3>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {filters.searchQuery 
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Get started by adding a new book to your library.'}
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

// Export the library page wrapped in ErrorBoundary
export default function LibraryPage() {
  return (
    <ErrorBoundary>
  <Suspense fallback={<div className="p-6 text-center text-gray-600 dark:text-gray-300">Loading library...</div>}>
        <LibraryPageContent />
      </Suspense>
    </ErrorBoundary>
  );
}
