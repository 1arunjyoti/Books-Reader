'use client';

import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Bookmark as BookmarkType } from '@/lib/api';
import { sanitizeBookmarkNote } from '@/lib/sanitize-text';
import { BookmarkIcon, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookmarkPanelProps {
  bookmarks: BookmarkType[];
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  onEditBookmark: (bookmark: BookmarkType) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onClose: () => void;
}

export default function BookmarkPanel({
  bookmarks,
  currentPage,
  onJumpToPage,
  onEditBookmark,
  onDeleteBookmark,
  onClose,
}: BookmarkPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // VIRTUALIZATION: Set up virtual scrolling for bookmarks
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each bookmark
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
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <BookmarkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bookmarks
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({bookmarks.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Bookmark List */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto"
      >
        {bookmarks.length === 0 ? (
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
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const bookmark = bookmarks[virtualItem.index];
              
              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
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
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Page {bookmark.pageNumber}
                      </span>
                    </div>
                    {bookmark.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">
                        {sanitizeBookmarkNote(bookmark.note)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(bookmark.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditBookmark(bookmark)}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                      title="Edit note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(bookmark.id)}
                      disabled={deletingId === bookmark.id}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                      title="Delete bookmark"
                    >
                      {deletingId === bookmark.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
