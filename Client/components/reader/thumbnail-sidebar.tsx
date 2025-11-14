"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;

interface ThumbnailSidebarProps {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  numPages: number;
  onPageClick: (page: number) => void;
  onClose: () => void;
}

// LRU cache size limit to prevent memory bloat
const THUMBNAIL_CACHE_SIZE = 50; // Keep max 50 thumbnails in memory
const MAX_CONCURRENT_GENERATIONS = 3; // Limit concurrent thumbnail generations

function ThumbnailSidebar({
  pdfDoc,
  currentPage,
  numPages,
  onPageClick,
  onClose,
}: ThumbnailSidebarProps) {
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const thumbnailsRef = useRef<Map<number, string>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const generatingRef = useRef<Set<number>>(new Set()); // Track thumbnails being generated
  const queueRef = useRef<number[]>([]); // Queue for pending thumbnail requests
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate thumbnail for a page with proper cleanup and throttling
  const generateThumbnail = useCallback(async (pageNum: number) => {
    if (!pdfDoc || thumbnailsRef.current.has(pageNum) || generatingRef.current.has(pageNum)) return;

    // ✅ THROTTLING: Limit concurrent generations
    if (generatingRef.current.size >= MAX_CONCURRENT_GENERATIONS) {
      // Add to queue if not already there
      if (!queueRef.current.includes(pageNum)) {
        queueRef.current.push(pageNum);
      }
      return;
    }

    // Mark as generating to prevent duplicate requests
    generatingRef.current.add(pageNum);

    let canvas: HTMLCanvasElement | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let page: any = null;

    try {
      page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails

      canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { 
        willReadFrequently: false,
        alpha: false, // Optimize for opaque content
        desynchronized: true // ✅ Better performance - allows async rendering
      });
      
      if (!context) {
        generatingRef.current.delete(pageNum);
        return;
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Use JPEG with lower quality for thumbnails (smaller size, faster)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      setThumbnails((prev) => {
        const next = new Map(prev);
        
        // Implement LRU eviction - remove oldest thumbnail if cache is full
        if (next.size >= THUMBNAIL_CACHE_SIZE) {
          const firstKey = next.keys().next().value;
          if (firstKey !== undefined) {
            next.delete(firstKey);
          }
        }
        
        next.set(pageNum, dataUrl);
        thumbnailsRef.current = next;
        return next;
      });
      
    } catch (err) {
      console.error(`Error generating thumbnail for page ${pageNum}:`, err);
    } finally {
      // Cleanup: Free canvas memory
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
      
      // Cleanup: Release PDF page resources
      if (page && typeof page.cleanup === 'function') {
        page.cleanup();
      }
      
      // Mark as no longer generating
      generatingRef.current.delete(pageNum);
      
      // Process next item in queue if any
      if (queueRef.current.length > 0) {
        const nextPageNum = queueRef.current.shift();
        if (nextPageNum !== undefined) {
          // Use setTimeout to avoid blocking
          setTimeout(() => generateThumbnail(nextPageNum), 0);
        }
      }
    }
  }, [pdfDoc]);

  // Set up intersection observer for lazy loading thumbnails
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '0', 10);
            if (pageNum > 0) {
              generateThumbnail(pageNum);
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    observerRef.current = observer;

    const containers = containerRef.current.querySelectorAll('[data-page]');
    containers.forEach((container) => observer.observe(container));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [pdfDoc, numPages, generateThumbnail]);

  // Cleanup thumbnails on unmount to free memory
  useEffect(() => {
    const generatingSet = generatingRef.current;
    const queue = queueRef.current;
    
    return () => {
      // Clear all thumbnails from memory
      setThumbnails(new Map());
      thumbnailsRef.current = new Map();
      generatingSet.clear();
      queue.length = 0; // Clear queue
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Page Thumbnails
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails Grid */}
      <div className="p-3 space-y-3">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === currentPage;
          const thumbnail = thumbnails.get(pageNum);

          return (
            <div
              key={pageNum}
              data-page={pageNum}
              onClick={() => onPageClick(pageNum)}
              className={`
                relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                ${isActive 
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-300 dark:ring-blue-600' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                }
              `}
            >
              {/* Thumbnail Image */}
              <div className=" bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={`Page ${pageNum}`}
                    width={200}
                    height={260}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="text-gray-400 dark:text-gray-500 text-xs">
                    Loading...
                  </div>
                )}
              </div>

              {/* Page Number */}
              <div className={`
                absolute bottom-0 left-0 right-0 py-1 text-center text-xs font-medium
                ${isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300'
                }
              `}>
                {pageNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const propsAreEqual = (prevProps: ThumbnailSidebarProps, nextProps: ThumbnailSidebarProps) => {
  return (
    prevProps.pdfDoc === nextProps.pdfDoc &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.numPages === nextProps.numPages &&
    prevProps.onPageClick === nextProps.onPageClick &&
    prevProps.onClose === nextProps.onClose
  );
};

export default React.memo(ThumbnailSidebar, propsAreEqual);
