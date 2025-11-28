"use client";

import { useState, useEffect, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { gutenbergService, GutenbergBook } from '@/lib/gutenberg';
import GutenbergBookCard from '@/components/gutenberg/GutenbergBookCard';
import GutenbergSearch from '@/components/gutenberg/GutenbergSearch';
import { Loader2, BookOpen, AlertCircle } from 'lucide-react';
// import { useRouter } from 'next/navigation'; // Unused

export default function GutenbergPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  // const router = useRouter(); // Unused

  // Clear message after 5 seconds
  useEffect(() => {
    if (importMessage) {
      const timer = setTimeout(() => setImportMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importMessage]);

  const { data, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: ['gutenberg', searchQuery, page],
    queryFn: () => searchQuery 
      ? gutenbergService.searchBooks(searchQuery, page)
      : gutenbergService.getPopularBooks(page),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  }, []);

  const handleImportSuccess = (bookTitle: string) => {
    setImportMessage({ type: 'success', text: `"${bookTitle}" added to your library!` });
  };

  const handleImportError = (errorMsg: string) => {
    setImportMessage({ type: 'error', text: errorMsg });
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl min-h-screen">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Project Gutenberg Library
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Browse and download over 70,000 free eBooks. Choose among free epub and kindle eBooks, download them or read them online.
        </p>
        
        <GutenbergSearch onSearch={handleSearch} initialQuery={searchQuery} />
      </div>

      {/* Notifications */}
      {importMessage && (
        <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border animate-in slide-in-from-right ${
          importMessage.type === 'success' 
            ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-900/90 dark:border-green-800 dark:text-green-200'
            : 'bg-red-50/90 border-red-200 text-red-800 dark:bg-red-900/90 dark:border-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {importMessage.type === 'success' ? <BookOpen className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <p className="font-medium">{importMessage.text}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-500">Loading books...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load books</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            {(error as Error).message || 'Something went wrong while fetching books from Project Gutenberg.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Results Info */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {data?.count ? `${data.count.toLocaleString()} books found` : 'No books found'}
            </p>
            
            {/* Pagination Controls (Top) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data?.previous || isPlaceholderData}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium px-2">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data?.next || isPlaceholderData}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>

          {/* Book Grid */}
          {data?.results && data.results.length > 0 ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {data.results.map((book: GutenbergBook) => (
                <GutenbergBookCard 
                  key={book.id} 
                  book={book} 
                  onImportSuccess={handleImportSuccess}
                  onImportError={handleImportError}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No books found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search terms.
              </p>
            </div>
          )}

          {/* Pagination Controls (Bottom) */}
          {data?.results && data.results.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
              <button
                onClick={() => {
                  setPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!data?.previous || isPlaceholderData}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous Page
              </button>
              <span className="font-medium">Page {page}</span>
              <button
                onClick={() => {
                  setPage(p => p + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={!data?.next || isPlaceholderData}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Page
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
