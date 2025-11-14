'use client';

import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { X, BookmarkIcon, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bookmark as BookmarkType } from '@/lib/api';
import { sanitizeBookmarkNote } from '@/lib/sanitize-text';
import type { NavItem } from 'epubjs';
import { logger } from '@/lib/logger';

interface ContentsAndBookmarksPanelProps {
  // TOC props
  toc: NavItem[];
  onTocItemClick: (href: string) => void;

  // Bookmark props
  bookmarks: BookmarkType[];
  isLoadingBookmarks?: boolean;
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  onEditBookmark: (bookmark: BookmarkType) => void;
  onDeleteBookmark: (bookmarkId: string) => void;

  onClose: () => void;
}

export default function ContentsAndBookmarksPanel({
  toc,
  onTocItemClick,
  bookmarks,
  isLoadingBookmarks = false,
  currentPage,
  onJumpToPage,
  onEditBookmark,
  onDeleteBookmark,
  onClose,
}: ContentsAndBookmarksPanelProps) {
  const [activeTab, setActiveTab] = useState<'contents' | 'bookmarks'>('contents');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debug logging
  logger.log('ContentsAndBookmarksPanel rendered:', {
    activeTab,
    toc: { length: toc.length, items: toc },
    bookmarks: { length: bookmarks.length, items: bookmarks },
    isLoadingBookmarks,
  });

  // VIRTUALIZATION: Set up virtual scrolling for TOC
  const tocParentRef = useRef<HTMLDivElement>(null);
  const tocVirtualizer = useVirtualizer({
    count: toc.length,
    getScrollElement: () => tocParentRef.current,
    estimateSize: () => 45, // Estimated height of each TOC item
    overscan: 5,
  });

  // VIRTUALIZATION: Set up virtual scrolling for Bookmarks
  const bookmarksParentRef = useRef<HTMLDivElement>(null);
  const bookmarksVirtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => bookmarksParentRef.current,
    estimateSize: () => 80, // Estimated height of each bookmark item
    overscan: 5,
  });

  const handleDelete = async (bookmarkId: string) => {
    setDeletingId(bookmarkId);
    try {
      await onDeleteBookmark(bookmarkId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {activeTab === 'contents' ? 'Contents' : 'Bookmarks'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex-shrink-0">
        <button
          onClick={() => setActiveTab('contents')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'contents'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Contents
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'bookmarks'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Bookmarks
          {bookmarks.length > 0 && (
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({bookmarks.length})
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Contents Tab */}
        {activeTab === 'contents' && (
          <div className="h-full p-2 flex flex-col">
            {toc.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No table of contents available
                </p>
              </div>
            ) : (
              <div 
                ref={tocParentRef}
                className="flex-1 overflow-auto"
              >
                <div
                  style={{
                    height: `${tocVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {tocVirtualizer.getVirtualItems().map((virtualItem) => {
                    const item = toc[virtualItem.index];
                    
                    return (
                      <button
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={tocVirtualizer.measureElement}
                        onClick={() => {
                          onTocItemClick(item.href);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-700 dark:text-gray-300 text-sm transition-colors"
                        title={item.label}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="truncate">{item.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div className="h-full flex flex-col">
            {isLoadingBookmarks ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading bookmarks...</p>
                </div>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <BookmarkIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No bookmarks yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Click the bookmark icon in the toolbar to save a page
                </p>
              </div>
            ) : (
              <div 
                ref={bookmarksParentRef}
                className="flex-1 overflow-auto"
              >
                <div
                  style={{
                    height: `${bookmarksVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {bookmarksVirtualizer.getVirtualItems().map((virtualItem) => {
                    const bookmark = bookmarks[virtualItem.index];
                    
                    return (
                      <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={bookmarksVirtualizer.measureElement}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-200 dark:border-gray-700 ${
                          bookmark.pageNumber === currentPage
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                            : ''
                        }`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => onJumpToPage(bookmark.pageNumber)}
                              className="flex-1 text-left group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <BookmarkIcon
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    bookmark.pageNumber === currentPage
                                      ? 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400'
                                      : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                  }`}
                                />
                                <div>
                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    Page {bookmark.pageNumber}
                                  </span>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </div>
                                </div>
                              </div>
                              {bookmark.note && (
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                                  {sanitizeBookmarkNote(bookmark.note)}
                                </p>
                              )}
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditBookmark(bookmark)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(bookmark.id)}
                                disabled={deletingId === bookmark.id}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
