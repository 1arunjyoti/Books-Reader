"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useState, useEffect, CSSProperties, useCallback, memo } from 'react';
import * as ReactWindow from 'react-window';
import { logger } from '@/lib/logger';
// react-window typings in this workspace can be inconsistent; access via any to avoid type export mismatches
const FixedSizeGrid = (ReactWindow as any).FixedSizeGrid;
const FixedSizeList = (ReactWindow as any).FixedSizeList;
import Image from 'next/image';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import ActionMenu from '@/components/library/ActionMenu';
import type { Book } from '@/lib/api';
import { preloadPdfJs } from '@/lib/pdf-preloader';
import { preloadEpubJs } from '@/lib/epub-preloader';

type Props = {
  books: Book[];
  viewMode: 'grid' | 'list';
  selectedBookIds: Set<string>;
  onToggleBookSelection: (id: string) => void;
  setEditingBook: (b: Book | null) => void;
  handleUpdateStatus: (id: string, status: string) => void;
  handleDeleteBook: (id: string) => void;
  // optional: limit number of rows rendered ahead
  overscan?: number;
};

/**
 * A small virtualized renderer that supports two modes:
 * - grid: uses FixedSizeGrid and renders a responsive number of columns based on container width
 * - list: uses FixedSizeList to render rows
 *
 * The component is intentionally conservative and keeps the item rendering markup close to
 * the existing Library grid/list so it can be swapped in with minimal visual change.
 */
export default function VirtualizedBooks({ books, viewMode, selectedBookIds, onToggleBookSelection, setEditingBook, handleUpdateStatus, handleDeleteBook, overscan = 3 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(1024);

  /* Preload appropriate reader library based on book file type */
  const preloadReaderForBook = useCallback((book: Book) => {
    const fileType = book.fileType?.toLowerCase() || '';
    
    if (fileType === 'epub') {
      preloadEpubJs().catch(err => logger.warn('EPUB.js preload failed:', err));
    } else if (fileType === 'pdf') {
      preloadPdfJs().catch(err => logger.warn('PDF.js preload failed:', err));
    }
    // TXT files don't need preloading as TxtViewer has no heavy dependencies
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setWidth(Math.max(320, Math.floor(rect.width)));
    };

    // Try ResizeObserver when available for efficient measurement, otherwise fall back to window resize
    const RO = (globalThis as any).ResizeObserver;
    let ro: any | null = null;
    if (RO) {
      ro = new RO(() => measure());
      ro.observe(containerRef.current!);
    }

    // initial measure
    measure();

    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (ro && typeof ro.disconnect === 'function') ro.disconnect();
    };
  }, []);

  // Decide columns to match the original Tailwind breakpoints used elsewhere
  const getColumns = () => {
    if (width >= 1024) return 5;
    if (width >= 768) return 4;
    if (width >= 640) return 3;
    return 2;
  };

  const columns = getColumns();

  if (viewMode === 'grid') {
    // compute column width and row height (aspect 2/3 for cover + some details height)
    const gap = 16; // approximate gap in px between items
    const columnWidth = Math.floor((width - gap * (columns - 1)) / columns);
    const rowHeight = Math.max(220, Math.floor(columnWidth * 1.45));

    const rowCount = Math.ceil(books.length / columns);

    // Memoize Cell component to prevent unnecessary re-renders
    const Cell = memo(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: CSSProperties }) => {
      const index = rowIndex * columns + columnIndex;
      if (index >= books.length) return null;
      const book = books[index];
      
      // Prioritize first 2 rows (for faster FCP above-the-fold)
      const shouldPrioritize = index < (columns * 2);

      return (
        <div style={style} className="p-1">
          <div className="h-full flex flex-col group relative bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl overflow-hidden shadow-sm transition-all duration-200 border border-gray-200/40 dark:border-gray-700/40">
            <div className={`absolute top-2 left-2 z-20`}>
              <Checkbox
                checked={selectedBookIds.has(book.id)}
                onCheckedChange={() => onToggleBookSelection(book.id)}
                className="bg-white dark:bg-white"
              />
            </div>

            <Link 
              href={`/library/read/${book.id}`} 
              className="block relative"
              onMouseEnter={() => preloadReaderForBook(book)}
              onTouchStart={() => preloadReaderForBook(book)}
            >
              <div className="aspect-[2/3] w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                                <Image
                      src={book.coverUrl || '/books-cover.jpg'}
                      alt={`${book.title} cover`}
                      width={180}
                      height={270}
                      quality={75}
                      loading={shouldPrioritize ? 'eager' : 'lazy'}
                      priority={shouldPrioritize}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3Crect width='2' height='3' fill='%23e5e7eb'/%3E%3C/svg%3E"
                      sizes="
                        (max-width: 640px) 100vw,
                        (max-width: 768px) 50vw,
                        (max-width: 1024px) 25vw,
                        20vw
                      "
                      className="object-cover w-full h-full"
                    />
                <div className="absolute bottom-2 right-2 z-10">
                  <span className="text-xs font-bold text-gray-300">{book.status}</span>
                </div>
              </div>
            </Link>

            <ActionMenu
              book={book}
              setEditingBook={setEditingBook}
              handleUpdateStatus={handleUpdateStatus}
              handleDeleteBook={handleDeleteBook}
            />

            <div className="p-2 bg-white/90 dark:bg-gray-800/90 flex-1 flex flex-col">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mb-1">{book.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{book.author || 'Unknown Author'}</p>
            </div>
          </div>
        </div>
      );
    });
    
    Cell.displayName = 'GridCell';

    return (
      <div ref={containerRef} className="w-full">
        <FixedSizeGrid
          columnCount={columns}
          columnWidth={columnWidth}
          height={Math.min(800, rowHeight * Math.min(rowCount, 8))}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
          overscanRowCount={overscan}
        >
          {Cell}
        </FixedSizeGrid>
      </div>
    );
  }

  // List view - Memoize Row component to prevent unnecessary re-renders
  const Row = memo(({ index, style }: { index: number; style: CSSProperties }) => {
    const book = books[index];
    
    // Prioritize first 5 items (for faster FCP above-the-fold)
    const shouldPrioritize = index < 5;
    return (
      <div style={style} className="p-2">
        <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200/40 dark:border-gray-700/40 flex items-start gap-3 p-3">
          <div className="flex-shrink-0 w-28 h-40 relative">
            <Link 
              href={`/library/read/${book.id}`} 
              className="block w-full h-full"
              onMouseEnter={() => preloadReaderForBook(book)}
              onTouchStart={() => preloadReaderForBook(book)}
            >
              <Image
                src={book.coverUrl || '/books-cover.jpg'}
                alt={`${book.title} cover`}
                width={112}
                height={160}
                quality={70}
                loading={shouldPrioritize ? 'eager' : 'lazy'}
                priority={shouldPrioritize}
                placeholder="blur"
                blurDataURL="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1.5 2'%3E%3Crect width='1.5' height='2' fill='%23d1d5db'/%3E%3C/svg%3E"
                sizes="
                  (max-width: 640px) 70px,
                  (max-width: 1024px) 100px,
                  112px
                "
                className="object-cover rounded w-full h-full"
              />
            </Link>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link 
                  href={`/library/read/${book.id}`}
                  onMouseEnter={() => preloadReaderForBook(book)}
                  onTouchStart={() => preloadReaderForBook(book)}
                >
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{book.title}</h3>
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">{book.author || 'Unknown Author'}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div>
                  <Checkbox checked={selectedBookIds.has(book.id)} onCheckedChange={() => onToggleBookSelection(book.id)} />
                </div>
                <ActionMenu book={book} setEditingBook={setEditingBook} handleUpdateStatus={handleUpdateStatus} handleDeleteBook={handleDeleteBook} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
  
  Row.displayName = 'ListRow';

  const estimatedHeight = 160;
  return (
    <div ref={containerRef} className="w-full">
      <FixedSizeList height={Math.min(800, estimatedHeight * Math.min(books.length, 8))} itemCount={books.length} itemSize={estimatedHeight} width={width} overscanCount={overscan}>
        {Row}
      </FixedSizeList>
    </div>
  );
}
