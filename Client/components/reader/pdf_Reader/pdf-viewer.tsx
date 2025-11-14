/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { sanitizeErrorMessage } from '@/lib/sanitize-text';

// Type definitions for PDF.js (using any due to dynamic import)
type PDFDocumentProxy = any;
type PDFPageProxy = any;
type PDFJSLib = any;

interface PDFViewerProps {
  url: string;
  initialPage?: number;
  scale?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onLoadSuccess?: (numPages: number) => void;
  onError?: (error: Error) => void;
}

export function PDFViewer({
  url,
  initialPage = 1,
  scale: externalScale,
  onPageChange,
  onLoadSuccess,
  onError,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(externalScale || 1.5);
  const [rendering, setRendering] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState<PDFJSLib | null>(null);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Load PDF.js library dynamically (client-side only)
  useEffect(() => {
    let isMounted = true;

    const loadPdfJs = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        
        if (!isMounted) return;

        // Configure worker - use local worker file from public directory
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        
        setPdfjsLib(pdfjs);
      } catch (err) {
        logger.error('Failed to load PDF.js:', err);
        if (isMounted) {
          setError('Failed to load PDF library');
        }
      }
    };

    loadPdfJs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update scale when external scale changes
  useEffect(() => {
    if (externalScale !== undefined) {
      setScale(externalScale);
    }
  }, [externalScale]);

  // Load PDF document
  useEffect(() => {
    if (!pdfjsLib) return;

    let isMounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        
        if (onLoadSuccess) {
          onLoadSuccess(pdf.numPages);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        setError(errorMessage);
        
        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, pdfjsLib]); // Remove onLoadSuccess and onError from dependencies

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || rendering) return;

    const renderPage = async () => {
      setRendering(true);
      
      try {
        const page: PDFPageProxy = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render the page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        if (onPageChange) {
          onPageChange(currentPage, numPages);
        }
      } catch (err) {
        logger.error('Error rendering page:', err);
      } finally {
        setRendering(false);
      }
    };

    renderPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc, currentPage, scale]); // Only re-render when these change

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load PDF
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-wrap break-words">
            {sanitizeErrorMessage(error)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="shadow-2xl max-w-full h-auto"
        />
      </div>
    </div>
  );
}

// Export additional hooks and utilities
export function usePDFViewer() {
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);

  return {
    currentPage,
    numPages,
    scale,
    setCurrentPage,
    setNumPages,
    setScale,
    goToPage: (page: number) => {
      if (page >= 1 && page <= numPages) {
        setCurrentPage(page);
      }
    },
    nextPage: () => setCurrentPage(prev => Math.min(prev + 1, numPages)),
    prevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1)),
    zoomIn: () => setScale(prev => Math.min(prev + 0.25, 3)),
    zoomOut: () => setScale(prev => Math.max(prev - 0.25, 0.5)),
    resetZoom: () => setScale(1.5),
  };
}
