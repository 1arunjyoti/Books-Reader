'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { X, BookmarkIcon, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Debug logging
  logger.log('ContentsAndBookmarksPanel rendered:', {
    activeTab,
    toc: { length: toc.length },
    bookmarks: { length: bookmarks.length },
    isLoadingBookmarks,
  });

  // VIRTUALIZATION: Set up virtual scrolling for Bookmarks
  const bookmarksParentRef = useRef<HTMLDivElement>(null);
  const bookmarksVirtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => bookmarksParentRef.current,
    estimateSize: () => 100, // Estimated height of each bookmark item
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

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Memoize onClose to prevent listener churn
  const handleClose = useCallback(() => onClose(), [onClose]);

  // Handle click outside to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // Use passive listener for better performance
    document.addEventListener('mousedown', handleClickOutside, { passive: true } as AddEventListenerOptions);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  const renderTocItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.subitems && item.subitems.length > 0;
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <div key={item.id} className="select-none">
        <div
          className={`
            flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md transition-colors
            hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            onTocItemClick(item.href);
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          
          <span className="flex-1 text-sm truncate" title={item.label}>
            {item.label}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.subitems!.map((child) => renderTocItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="absolute top-16 right-0 bottom-0 w-80 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-20 flex flex-col overflow-y-auto custom-scrollbar"
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {activeTab === 'contents' ? 'Contents' : 'Bookmarks'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
        <button
          onClick={() => setActiveTab('contents')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'contents'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/30'
          }`}
        >
          Contents
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
            activeTab === 'bookmarks'
              ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/30'
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
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Contents Tab */}
        {activeTab === 'contents' && (
          <div className="p-2">
            {toc.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No table of contents available
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {toc.map((item) => renderTocItem(item))}
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
                <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <BookmarkIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                  No bookmarks yet
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Click the bookmark icon in the toolbar to save a page
                </p>
              </div>
            ) : (
              <div 
                ref={bookmarksParentRef}
                className="flex-1 overflow-auto custom-scrollbar"
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
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div
                          className={`p-4 border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors ${
                            bookmark.pageNumber === currentPage
                              ? 'bg-blue-50/80 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                              : 'border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => onJumpToPage(bookmark.pageNumber)}
                              className="flex-1 text-left group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <BookmarkIcon
                                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                    bookmark.pageNumber === currentPage
                                      ? 'text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400'
                                      : 'text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                  }`}
                                />
                                <div>
                                  <span className={`font-medium text-sm transition-colors ${
                                    bookmark.pageNumber === currentPage
                                      ? 'text-blue-700 dark:text-blue-300'
                                      : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                  }`}>
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
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-1">
                                  {sanitizeBookmarkNote(bookmark.note)}
                                </p>
                              )}
                            </button>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditBookmark(bookmark)}
                                className="h-7 w-7 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(bookmark.id)}
                                disabled={deletingId === bookmark.id}
                                className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" />
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
