'use client';

import React, { Component, ReactNode } from 'react';
import { WifiOff, BookOpen, ExternalLink } from 'lucide-react';
import { offlineStorage } from '@/lib/offline-storage';
import { Book } from '@/lib/api';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  offlineBooks: { book: Book; fileBlob: Blob }[];
  isLoading: boolean;
}

export class OfflineClerkBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      offlineBooks: [],
      isLoading: true
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a Clerk error or network error
    // Clerk errors often contain "Clerk" or network-related messages
    if (
      error.message.includes('Clerk') || 
      error.message.includes('Network') ||
      error.message.includes('fetch') ||
      !navigator.onLine
    ) {
      return { hasError: true };
    }
    return {};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('OfflineClerkBoundary caught error:', error);
    this.loadOfflineBooks();
  }

  async loadOfflineBooks() {
    try {
      const books = await offlineStorage.getAllOfflineBooks();
      this.setState({ offlineBooks: books, isLoading: false });
    } catch (err) {
      console.error('Failed to load offline books:', err);
      this.setState({ isLoading: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <html lang="en">
          <body className="antialiased bg-white dark:bg-gray-900">
            <div className="min-h-screen flex flex-col">
              {/* Simplified Offline Header */}
              <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
                <div className="container mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <span className="text-xl font-bold text-gray-900 dark:text-white">Books Reader</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                    <WifiOff className="h-4 w-4" />
                    <span>Offline Mode</span>
                  </div>
                </div>
              </header>

              {/* Offline Content */}
              <main className="flex-1 container mx-auto px-4 py-8">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Offline Library</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    You are currently offline. You can read books you have previously downloaded.
                  </p>
                </div>

                {this.state.isLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : this.state.offlineBooks.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {this.state.offlineBooks.map(({ book }) => (
                      <div key={book.id} className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="aspect-[2/3] relative bg-gray-100 dark:bg-gray-800">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={book.coverUrl} 
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <BookOpen className="h-12 w-12" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full text-white">
                            <WifiOff className="h-3 w-3" />
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1 mb-1" title={book.title}>
                            {book.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-3">
                            {book.author}
                          </p>
                          <a 
                            href={`/library/read/${book.id}`}
                            className="mt-auto w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            <BookOpen className="h-4 w-4" />
                            Read
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <WifiOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Offline Books</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      You haven&apos;t downloaded any books yet. Connect to the internet to download books for offline reading.
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-6 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Try Reconnecting
                    </button>
                  </div>
                )}
              </main>
            </div>
          </body>
        </html>
      );
    }

    return this.props.children;
  }
}
