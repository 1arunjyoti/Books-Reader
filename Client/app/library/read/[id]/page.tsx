"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuthToken } from '@/contexts/AuthTokenContext';
import { PDFReader } from '@/components/reader/pdf_Reader/pdf-reader';
import TxtViewer from '@/components/reader/txt_Reader/txt-viewer';
import { fetchBook, updateBook, getPresignedUrl } from '@/lib/api';
import { getCachedPresignedUrl } from '@/lib/epub-cache';
import type { Book } from '@/lib/api';

import { offlineStorage } from '@/lib/offline-storage';

// Lazy load the EPUB viewer for better performance
const ReactEpubViewer = dynamic(
  () => import('@/components/reader/epub_Reader/react-epub-viewer-refactored'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading EPUB reader...</p>
        </div>
      </div>
    ),
  }
);

interface ReadPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReadPage({ params }: ReadPageProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const router = useRouter();
  const [bookId, setBookId] = useState<string>('');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounce progress updates
  const { getAccessToken: getCachedAccessToken } = useAuthToken();

  useEffect(() => {
    params.then((resolvedParams) => {
      setBookId(resolvedParams.id);
    });
  }, [params]);



  useEffect(() => {
    if (!bookId) return;

    const loadBook = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`[ReadPage] Checking offline availability for book: ${bookId}`);
        
        // 1. Check if book is available offline
        try {
          const offlineBook = await offlineStorage.getOfflineBook(bookId);
          console.log(`[ReadPage] Offline book found: ${!!offlineBook}`);

          if (offlineBook) {
            console.log('[ReadPage] Loading book from offline storage');
            setBook(offlineBook.book);
            const objectUrl = URL.createObjectURL(offlineBook.fileBlob);
            setFileUrl(objectUrl);
            setLoading(false);
            return;
          }
        } catch (storageError) {
          console.error('[ReadPage] Error checking offline storage:', storageError);
        }

        // 2. If not offline, try to fetch from server
        const accessToken = await getCachedAccessToken();

        if (!accessToken) {
          // If no token and not offline, redirect to login
          router.push('/sign-in?returnTo=/library');
          return;
        }

        // Fetch book metadata and presigned URL in parallel
        const [fetchedBook, presignedUrl] = await Promise.all([
          fetchBook(bookId, accessToken),
          getCachedPresignedUrl(
            bookId,
            () => getPresignedUrl(bookId, accessToken, 604800), // 7 days
            604800
          ),
        ]);

        setBook(fetchedBook);
        setFileUrl(presignedUrl);
      } catch (err) {
        console.error('Error loading book:', err);
        // Check if it's a network error
        if (!window.navigator.onLine) {
          setError('You are offline and this book is not downloaded.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load book');
        }
      } finally {
        setLoading(false);
      }
    };

    loadBook();
    
    // Cleanup ObjectURL on unmount if it was created
    return () => {
      if (fileUrl && fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]); // Only depend on bookId

  /* Handle page change - memoized to prevent infinite loops */
  const handlePageChange = useCallback(async (page: number, totalPages: number) => {
    if (!book) return;

    const progress = Math.round((page / totalPages) * 100);

    // Update local state immediately for responsive UI
    setBook(prev => prev ? {
      ...prev,
      currentPage: page,
      totalPages: totalPages,
      progress: progress,
      status: progress === 100 ? 'read' : 'reading',
    } : null);

    // Debounce database updates (only update after 1 second of no page changes)
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const accessToken = await getCachedAccessToken();
        if (!accessToken) return;

        // Update book progress in database
        await updateBook(
          book.id,
          {
            currentPage: page,
            totalPages: totalPages,
            progress: progress,
            status: progress === 100 ? 'read' : 'reading',
          },
          accessToken
        );
      } catch (err) {
        console.error('Error updating progress:', err);
      }
    }, 1000); // Wait 1 second before saving to database
  }, [book, getCachedAccessToken]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    router.push('/library');
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading book...</p>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error || !book || !fileUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Book not found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The book you&apos;re trying to read could not be loaded.
          </p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  // Determine which viewer to use based on fileType
  const fileType = book.fileType || 'pdf'; // Default to pdf for backward compatibility

  /* Epub viewer */
  if (fileType === 'epub') {
    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading EPUB file...</p>
          </div>
        </div>
      );
    }
    
    return (
      <ReactEpubViewer
        fileUrl={fileUrl}
        bookId={book.id}
        currentPage={Number(book.currentPage) || 0}
        onPageChange={(page: number, totalPages: number) => handlePageChange(page, totalPages)}
        onClose={handleClose}
      />
    );
  }

  /* Txt viewer */
  if (fileType === 'txt') {
    return (
      <TxtViewer
        fileUrl={fileUrl}
        bookId={book.id}
        currentPage={Number(book.currentPage) || 0}
        onPageChange={(page) => handlePageChange(page, book.totalPages || 1)}
        onClose={handleClose}
      />
    );
  }

  // Default to PDF viewer
  return (
    <PDFReader
      url={fileUrl}
      bookId={book.id}
      title={book.title}
      initialPage={Number(book.currentPage) || 1}
      onPageChange={handlePageChange}
      onClose={handleClose}
    />
  );
}
