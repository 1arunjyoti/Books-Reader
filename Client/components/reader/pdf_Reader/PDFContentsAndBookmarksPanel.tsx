"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useVirtualizer } from '@tanstack/react-virtual';
import { X, BookmarkIcon, Edit2, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Bookmark as BookmarkType } from '@/lib/api';
import { sanitizeBookmarkNote } from '@/lib/sanitize-text';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface OutlineItem {
  title: string;
  dest: string | null;
  pageNumber?: number;
  items?: OutlineItem[];
  expanded?: boolean;
}

interface PDFContentsAndBookmarksPanelProps {
  // TOC props
  pdfDoc: PDFDocumentProxy | null;

  // Bookmark props
  bookmarks: BookmarkType[];
  currentPage: number;
  onJumpToPage: (pageNumber: number) => void;
  onEditBookmark: (bookmark: BookmarkType) => void;
  onDeleteBookmark: (bookmarkId: string) => void;

  onClose: () => void;
}

function PDFContentsAndBookmarksPanel({
  pdfDoc,
  bookmarks,
  currentPage,
  onJumpToPage,
  onEditBookmark,
  onDeleteBookmark,
  onClose,
}: PDFContentsAndBookmarksPanelProps) {
  const [activeTab, setActiveTab] = useState<'contents' | 'bookmarks'>('contents');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const bookmarksContainerRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling for bookmarks list
  const bookmarksVirtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => bookmarksContainerRef.current,
    estimateSize: () => 100, // Estimated height per bookmark item
    overscan: 5, // Render 5 extra items above and below viewport
  });

  // Memoize onClose to prevent recreation on every render
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

  // Load PDF outline/table of contents
  useEffect(() => {
    const loadOutline = async () => {
      if (!pdfDoc) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const outlineData = await pdfDoc.getOutline();

        if (!outlineData || outlineData.length === 0) {
          setOutline(null);
          setLoading(false);
          return;
        }

        // Resolve page numbers for each outline item
        const resolvePageNumbers = async (items: OutlineItem[]): Promise<OutlineItem[]> => {
          const resolved = [];
          for (const item of items) {
            const resolvedItem = { ...item };
            
            // Get page number from destination
            if (item.dest) {
              try {
                const dest = typeof item.dest === 'string' 
                  ? await pdfDoc.getDestination(item.dest)
                  : item.dest;
                
                if (dest && dest[0]) {
                  const pageRef = dest[0];
                  const pageIndex = await pdfDoc.getPageIndex(pageRef);
                  resolvedItem.pageNumber = pageIndex + 1; // 1-indexed
                }
              } catch (err) {
                logger.error('Error resolving page number:', err);
              }
            }

            // Recursively resolve nested items
            if (item.items && item.items.length > 0) {
              resolvedItem.items = await resolvePageNumbers(item.items);
            }

            resolved.push(resolvedItem);
          }
          return resolved;
        };

        const resolvedOutline = await resolvePageNumbers(outlineData);
        setOutline(resolvedOutline);
      } catch (err) {
        logger.error('Error loading outline:', err);
        setOutline(null);
      } finally {
        setLoading(false);
      }
    };

    loadOutline();
  }, [pdfDoc]);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleDelete = async (bookmarkId: string) => {
    setDeletingId(bookmarkId);
    try {
      await onDeleteBookmark(bookmarkId);
    } finally {
      setDeletingId(null);
    }
  };

  const renderOutlineItem = (item: OutlineItem, level: number = 0) => {
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const isActive = item.pageNumber === currentPage;

    return (
      <div key={item.title} className="select-none">
        <div
          className={`
            flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md transition-colors
            ${isActive 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (item.pageNumber) {
              onJumpToPage(item.pageNumber);
            }
            if (hasChildren) {
              toggleExpanded(item.title);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.title);
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
          
          <span className="flex-1 text-sm truncate" title={item.title}>
            {item.title}
          </span>
          
          {item.pageNumber && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {item.pageNumber}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.items!.map((child) => renderOutlineItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg z-20 flex flex-col" ref={panelRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {activeTab === 'contents' ? 'Contents' : 'Bookmarks'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
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
      <div className="flex-1 overflow-y-auto">
        {/* Contents Tab */}
        {activeTab === 'contents' && (
          <div className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Loading table of contents...
                </div>
              </div>
            ) : outline && outline.length > 0 ? (
              <div className="space-y-1">
                {outline.map((item) => renderOutlineItem(item))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No table of contents available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === 'bookmarks' && (
          <div>
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
              <div ref={bookmarksContainerRef} className="h-full overflow-auto">
                <div
                  style={{
                    height: `${bookmarksVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {bookmarksVirtualizer.getVirtualItems().map((virtualRow) => {
                    const bookmark = bookmarks[virtualRow.index];
                    
                    return (
                      <div
                        key={bookmark.id}
                        data-index={virtualRow.index}
                        ref={bookmarksVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div
                          className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                            bookmark.pageNumber === currentPage
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600'
                              : ''
                          }`}
                        >
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

const propsAreEqual = (prevProps: PDFContentsAndBookmarksPanelProps, nextProps: PDFContentsAndBookmarksPanelProps) => {
  return (
    prevProps.pdfDoc === nextProps.pdfDoc &&
    prevProps.bookmarks?.length === nextProps.bookmarks?.length &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.onJumpToPage === nextProps.onJumpToPage &&
    prevProps.onEditBookmark === nextProps.onEditBookmark &&
    prevProps.onDeleteBookmark === nextProps.onDeleteBookmark &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(PDFContentsAndBookmarksPanel, propsAreEqual);
