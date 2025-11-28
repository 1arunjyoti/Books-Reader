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
      className="absolute left-0 top-16 h-full w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 shadow-2xl overflow-y-auto custom-scrollbar z-20"
    >
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between z-10">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Page Thumbnails
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Thumbnails Grid */}
      <div className="p-4 space-y-4">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
          const isActive = pageNum === currentPage;
          const thumbnail = thumbnails.get(pageNum);

          return (
            <div
              key={pageNum}
              data-page={pageNum}
              onClick={() => onPageClick(pageNum)}
              className={`
                relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 group
                ${isActive 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20 scale-[1.02]' 
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md bg-gray-50 dark:bg-gray-800'
                }
              `}
            >
              {/* Thumbnail Image */}
              <div className="aspect-[1/1.4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={`Page ${pageNum}`}
                    fill
                    className="object-contain p-2"
                    sizes="200px"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-xs">Loading...</span>
                  </div>
                )}
                
                {/* Active Overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                )}
              </div>

              {/* Page Number */}
              <div className={`
                absolute bottom-0 left-0 right-0 py-1.5 text-center text-xs font-medium backdrop-blur-sm transition-colors
                ${isActive 
                  ? 'bg-blue-500/90 text-white' 
                  : 'bg-white/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-300 group-hover:bg-white/95 dark:group-hover:bg-gray-900/95'
                }
              `}>
                Page {pageNum}
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
